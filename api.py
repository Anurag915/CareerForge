from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
import uuid
import db
import rag
import llm
import utils
from utils import extract_text, extract_sections, clean_output

app = Flask(__name__)
CORS(app)

# Initialize Database
db.init_db()

@app.route('/upload', methods=['POST'])
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    file = request.files['resume']
    doc_type = request.form.get('type', 'resume') # resume, job, portfolio
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Create unique ID
    resume_id = str(uuid.uuid4())[:8]
    temp_path = f"data/temp_{resume_id}.pdf"
    
    if not os.path.exists("data"):
        os.makedirs("data")

    try:
        file.save(temp_path)
        text = extract_text(temp_path)
        if not text.strip():
            return jsonify({"error": "Could not extract text from PDF."}), 400

        # 1. Parse Sections
        sections = extract_sections(text)
        
        # 2. Save to DB
        resume_data = {
            "id": resume_id,
            "filename": file.filename,
            "raw_text": text,
            "doc_type": doc_type,
            "sections": sections
        }
        db.save_resume(resume_data)
        
        # 3. Create RAG Index (Per-doc + Global)
        rag.create_index(resume_id, text, doc_type)
        
        return jsonify({
            "message": "Document uploaded and indexed successfully",
            "resume_id": resume_id,
            "doc_type": doc_type,
            "filename": file.filename
        })

    except Exception as e:
        print(f"Upload Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/global-chat', methods=['POST'])
def global_chat():
    data = request.json
    question = data.get('question', '')
    
    if not question:
        return jsonify({"error": "No question provided"}), 400
        
    # 1. Get context from Global FAISS Index
    context = rag.query_global_index(question)
    
    # 2. Get response from LLM
    answer = llm.get_global_chat_response(context, question)
    
    return jsonify({
        "answer": answer,
        "context_used": context[:300] + "..." if context else ""
    })

@app.route('/resumes', methods=['GET'])
def list_resumes():
    resumes = db.get_all_resumes()
    return jsonify(resumes)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    resume_id = data.get('resume_id')
    question = data.get('question', '')
    
    if not resume_id or not question:
        return jsonify({"error": "resume_id and question are required"}), 400
        
    context = rag.query_index(resume_id, question)
    answer = llm.get_chat_response(context, question)
    
    return jsonify({
        "answer": answer,
        "resume_id": resume_id
    })

@app.route('/chat/<resume_id>', methods=['POST'])
def chat_with_resume(resume_id):
    data = request.json
    question = data.get('question', '')
    
    if not question:
        return jsonify({"error": "No question provided"}), 400
        
    # 1. Get context from RAG
    context = rag.query_index(resume_id, question)
    
    # 2. Get response from LLM
    answer = llm.get_chat_response(context, question)
    
    return jsonify({
        "answer": answer,
        "context_used": context[:200] + "..." if context else ""
    })

# Unified Resume Intelligence Retrieval
# (This route is handled by get_resume_analysis below)

import comparison

@app.route('/resume/<resume_id>', methods=['GET'])
def get_resume_analysis(resume_id):
    print(f"DEBUG - FETCHING ANALYSIS FOR: {resume_id}")
    conn = sqlite3.connect(db.DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    # Get the latest analysis for this resume
    cursor.execute('''
        SELECT a.detailed_json, r.filename, a.ats_score, r.summary, r.skills, r.experience, r.education, r.projects, r.achievements, r.other_sections
        FROM analysis_results a
        JOIN resumes r ON a.resume_id = r.id
        WHERE r.id = ?
        ORDER BY a.id DESC LIMIT 1
    ''', (resume_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return jsonify({"error": "Analysis not found for this resume"}), 404
        
    res = dict(row)
    analysis_data = json.loads(res['detailed_json'])
    
    return jsonify({
        "resume_id": resume_id,
        "filename": res['filename'],
        "sections": {
            "summary": res['summary'],
            "skills": res['skills'],
            "experience": res['experience'],
            "education": res['education'],
            "projects": res['projects'],
            "achievements": res['achievements'],
            "other_sections": json.loads(res.get('other_sections', '{}') or '{}')
        },
        **analysis_data
    })

@app.route('/analyze/<resume_id>', methods=['POST'])
def analyze_stored_resume(resume_id):
    data = request.json
    job_description = data.get('job_description', '')
    
    if not job_description:
        return jsonify({"error": "No job description provided"}), 400
        
    # 1. Get resume text from DB
    resume = db.get_resume(resume_id)
    if not resume:
        return jsonify({"error": "Resume not found"}), 404
        
    # 2. Run analysis
    raw_analysis = llm.analyze_resume_ats(resume['raw_text'], job_description)
    analysis_data = clean_output(raw_analysis)
    
    # PHASE 1: Deterministic ATS Scoring
    ats_results = utils.calculate_ats_score(resume['raw_text'], job_description)
    analysis_data.update(ats_results)
    final_score = ats_results['ats_score']
    
    # 3. Save to History (Phase 5 Memory)
    db.save_analysis(resume_id, job_description, final_score, analysis_data)
    
    return jsonify({
        "resume_id": resume_id,
        "filename": resume['filename'],
        "sections": {
            "summary": resume['summary'],
            "skills": resume['skills'],
            "experience": resume['experience'],
            "education": resume['education'],
            "projects": resume['projects'],
            "achievements": resume['achievements'],
            "other_sections": json.loads(resume.get('other_sections', '{}') or '{}')
        },
        **analysis_data
    })

@app.route('/compare', methods=['POST'])
def compare_resumes():
    data = request.json
    resume_ids = data.get('resume_ids', [])
    job_description = data.get('job_description', '')
    
    if not job_description:
        return jsonify({"error": "Job description is required for context-aware comparison"}), 400
        
    if not resume_ids or len(resume_ids) < 2:
        return jsonify({"error": "At least two resume_ids are required for comparison"}), 400
        
    resume_list = []
    for rid in resume_ids:
        r = db.get_resume(rid)
        if r: resume_list.append(r)
        
    if not resume_list:
        return jsonify({"error": "No valid resumes found for provided IDs"}), 404
        
    top_n = data.get('top_n')
    results = comparison.compare_resumes(resume_list, job_description, top_n)
    return jsonify(results)

@app.route('/history', methods=['GET'])
def get_analysis_history():
    history = db.get_history()
    return jsonify(history)

@app.route('/analyze-advanced', methods=['POST'])
def analyze_advanced():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    file = request.files['resume']
    job_description = request.form.get('job_description', '')
    
    # 1. Standard Upload & Indexing
    # This reuse the logic from /upload but in one go
    resume_id = str(uuid.uuid4())[:8]
    temp_path = f"data/temp_{resume_id}.pdf"
    
    try:
        file.save(temp_path)
        text = extract_text(temp_path)
        sections = extract_sections(text)
        
        db.save_resume({
            "id": resume_id,
            "filename": file.filename,
            "raw_text": text,
            "doc_type": "resume",
            "sections": sections
        })
        rag.create_index(resume_id, text)

        # 2. Run analysis (Using structured sections)
        raw_analysis = llm.analyze_resume_ats(sections, job_description)
        analysis_data = clean_output(raw_analysis)
        
        # PHASE 1: Deterministic ATS Scoring (Override LLM if needed)
        ats_results = utils.calculate_ats_score(text, job_description)
        analysis_data.update(ats_results)
        final_score = ats_results['ats_score']
        
        # 3. Save to history
        print(f"DEBUG - PERSISTING ANALYSIS FOR {resume_id} (Score: {final_score})")
        print(f"DEBUG - SAVING DATA: {list(analysis_data.keys())}")
        db.save_analysis(resume_id, job_description, final_score, analysis_data)

        return jsonify({
            "resume_id": resume_id,
            "filename": file.filename,
            "sections": sections,
            **analysis_data
        })
    except Exception as e:
        print(f"API ERROR: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path): os.remove(temp_path)

if __name__ == '__main__':
    print("Level 3 AI Resume Server Starting...")
    app.run(host='0.0.0.0', port=5000, debug=True)

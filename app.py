from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import extract_text, chunk_text, clean_output, validate_analyze_output, extract_sections, calculate_heuristic_scores
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import requests
import os
import json

app = Flask(__name__)
CORS(app)

print("Loading Embedding Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_job_match_analysis(context, job_description, heuristics):
    try:
        print(f"Sending request to Ollama for ATS Analysis... (Context length: {len(context)} chars)")
        
        # Injecting heuristics to give LLM a head start
        sections_json = json.dumps(heuristics.get("sections", {}))
        
        prompt = f"""
        You are an ATS system.
        Analyze the resume and job description.
        
        Return ONLY valid JSON.
        
        {{
        "match_score": 0-100,
        "matched_skills": [],
        "missing_skills": [],
        "ats_score": 0-100,
        "keyword_match_score": 0-100,
        "format_score": 0-100,
        "section_score": 0-100,
        "keywords": [],
        "top_skills": [],
        "tools": [],
        "sections": {{
        "skills": "",
        "experience": "",
        "education": "",
        "projects": ""
        }}
        }}
        
        Rules:
        * No explanation outside JSON
        * Scores must be numbers
        * Lists must be clean arrays
        * Use the provided context to fill the sections if they are empty
        
        Resume:
        {context}
        
        Job Description:
        {job_description}
        """
        
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "format": "json",
                "prompt": prompt,
                "stream": False
            },
            timeout=300
        )
        print("Received response from Ollama.")
        return response.json().get("response", "{}")
    except Exception as e:
        print(f"Ollama Error: {e}")
        return "{}"

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    file = request.files['resume']
    job_description = request.form.get('job_description', '')

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if not job_description.strip():
        return jsonify({"error": "No job description provided"}), 400

    temp_path = f"temp_{os.getpid()}_{file.filename}"
    try:
        file.save(temp_path)
        text = extract_text(temp_path)
        if not text.strip():
            return jsonify({"error": "Could not extract text from PDF."}), 400

        # Heuristic / Rule-based Phase
        sections = extract_sections(text)
        heuristics = calculate_heuristic_scores(text, sections)
        heuristics["sections"] = sections

        # RAG Logic Phase
        chunks = chunk_text(text, chunk_size=500)
        embeddings = model.encode(chunks)
        dim = embeddings.shape[1]
        index = faiss.IndexFlatL2(dim)
        index.add(np.array(embeddings))

        # Use Job Description as the query for FAISS to get relevant context
        query_embedding = model.encode([job_description])
        D, I = index.search(np.array(query_embedding), k=5)
        
        # Guard against index out of bounds if chunks < 5
        relevant_indices = [i for i in I[0] if i < len(chunks)]
        relevant_chunks = [chunks[i] for i in relevant_indices]
        context = "\n\n".join(relevant_chunks)

        # AI Analysis Phase
        analysis_raw = get_job_match_analysis(context, job_description, heuristics)
        cleaned = clean_output(analysis_raw)
        
        # Validation & Merge Phase
        validated = validate_analyze_output(cleaned, heuristics)

        return jsonify(validated)

    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500
    finally:
        if os.path.exists(temp_path):
            try: os.remove(temp_path)
            except: pass

if __name__ == '__main__':
    print("Starting AI Resume Server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)

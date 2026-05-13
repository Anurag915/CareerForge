import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json
import os
import uuid
import db
import rag
import llm
import utils
from utils import extract_text, extract_sections, clean_output
import jwt
import bcrypt
import datetime
import threading
from functools import wraps
from tasks import analyze_resume_job, optimize_resumes_job
from celery_app import celery_app

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Security Configuration
JWT_SECRET = "careerforge-super-secret-key-2026" # In production, use os.getenv('JWT_SECRET')
JWT_ALGORITHM = "HS256"

# Initialize Socket.IO with Redis as message queue for cross-process communication
socketio = SocketIO(app, cors_allowed_origins="*", message_queue=os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

from flask_socketio import join_room

@socketio.on('join')
def on_join(data):
    user_id = data.get('user_id')
    if user_id:
        join_room(f"user_{user_id}")
        print(f"User {user_id} joined their notification room.")

# Initialize Database
db.init_db()

# --- AUTH MIDDLEWARE ---
def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Authentication token missing"}), 401
        
        try:
            # Token format: "Bearer <token>"
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            # Bulletproof Check: Ensure user actually exists in this DB instance!
            # Prevents crashing when switching DBs while holding stale JWTs.
            user = db.get_user_by_id(data.get('user_id'))
            if not user:
                 return jsonify({"error": "User no longer exists in system. Please sign up again."}), 401
                 
            request.user = data
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated

def require_role(role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'user') or request.user.get('role') != role:
                return jsonify({"error": f"Access denied. Requires {role} role."}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

# --- AUTH ENDPOINTS ---
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'candidate')

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400
    
    if role not in ['candidate', 'hiring_manager']:
        return jsonify({"error": "Invalid role"}), 400

    # Hash password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user_id = str(uuid.uuid4())[:8]
    success = db.save_user({
        "id": user_id,
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": role
    })
    
    if not success:
        return jsonify({"error": "Email already registered"}), 400
        
    return jsonify({"message": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
        
    user = db.get_user_by_email(email)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({"error": "Invalid password"}), 401
        
    # Generate JWT
    payload = {
        "user_id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "role": user['role'],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return jsonify({
        "token": token,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": user['role']
        }
    })

@app.route('/upload', methods=['POST'])
@auth_required
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    file = request.files['resume']
    doc_type = request.form.get('type', 'resume') # resume, job, portfolio
    persist = request.form.get('persist', 'true').lower() == 'true'
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Create unique ID
    resume_id = str(uuid.uuid4())[:8]
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(BASE_DIR, "data")
    temp_path = os.path.join(data_dir, f"temp_{resume_id}.pdf")
    
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    try:
        file.save(temp_path)
        text = extract_text(temp_path)
        if not text.strip():
            return jsonify({"error": "Could not extract text from PDF."}), 400

        # 1. Parse Sections
        sections = extract_sections(text)
        
        # 2. Save to DB
        user_id = request.user['user_id']
        resume_data = {
            "id": resume_id,
            "filename": file.filename,
            "raw_text": text,
            "doc_type": doc_type,
            "sections": sections
        }
        if persist:
            db.save_resume(resume_data, user_id)
        
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
@auth_required
def global_chat():
    data = request.json
    question = data.get('question', '')
    
    if not question:
        return jsonify({"error": "No question provided"}), 400
        
    # 1. Get context from Global FAISS Index
    context = rag.query_global_index(question)
    
    # 2. Get response from LLM
    answer = llm.get_global_chat_response(context, question)
    
    # 3. Save to DB [NEW]
    user_id = request.user['user_id']
    db.save_chat_message(user_id, 'user', question, None) # Global context
    db.save_chat_message(user_id, 'assistant', answer, None)
    
    return jsonify({
        "answer": answer,
        "context_used": context[:300] + "..." if context else ""
    })

@app.route('/resumes', methods=['GET'])
@auth_required
def list_resumes():
    user_id = request.user['user_id']
    resumes = db.get_all_resumes(user_id)
    return jsonify(resumes)

@app.route('/api/chat/sessions', methods=['GET', 'POST'])
@auth_required
def handle_chat_sessions():
    user_id = request.user['user_id']
    if request.method == 'POST':
        data = request.json or {}
        title = data.get('title', 'New Conversation')
        session_id = db.create_chat_session(user_id, title)
        return jsonify({"id": session_id, "title": title}), 201
    else:
        sessions = db.get_chat_sessions(user_id)
        return jsonify(sessions)

@app.route('/api/chat/sessions/<session_id>', methods=['GET', 'DELETE'])
@auth_required
def handle_single_session(session_id):
    user_id = request.user['user_id']
    session = db.get_chat_session(session_id)
    
    if not session or session['user_id'] != user_id:
        return jsonify({"error": "Session not found"}), 404
        
    if request.method == 'DELETE':
        db.delete_chat_session(session_id, user_id)
        return jsonify({"success": True})
    
    messages = db.get_chat_history(session_id)
    return jsonify({
        "session": session,
        "messages": messages
    })

@app.route('/api/chat/sessions/<session_id>/message', methods=['POST'])
@auth_required
def send_chat_message(session_id):
    user_id = request.user['user_id']
    session = db.get_chat_session(session_id)
    
    if not session or session['user_id'] != user_id:
        return jsonify({"error": "Unauthorized access to session"}), 403
        
    data = request.json
    prompt = data.get('prompt', '').strip()
    context_resume_id = data.get('resume_id') # Optional specific context
    
    if not prompt:
        return jsonify({"error": "Empty prompt provided"}), 400
        
    # 1. Store User Message Prompt
    db.save_chat_message(session_id, 'user', prompt)
    
    # 2. Context Sourcing from RAG (if non-global)
    context = ""
    if context_resume_id and context_resume_id != "global":
        try:
            context = rag.query_index(context_resume_id, prompt)
        except Exception as e:
            print(f"RAG retrieval fail for {context_resume_id}: {e}")
    
    # 3. LLM Dispatch
    try:
        answer = llm.get_chat_response(context, prompt)
        
        # 4. Auto-update generic titles on very first interaction round
        existing_history = db.get_chat_history(session_id)
        if len(existing_history) <= 2 and session['title'] == "New Conversation":
            # Intelligent snapshot naming
            snapped_title = prompt[:40] + ("..." if len(prompt) > 40 else "")
            db.update_chat_title(session_id, snapped_title)
            
        # 5. Save finalized AI response
        db.save_chat_message(session_id, 'assistant', answer)
        
        return jsonify({
            "role": "assistant",
            "content": answer,
            "context_used": context[:120] if context else None
        })
    except Exception as e:
        print(f"LLM CHAT ERROR: {e}")
        return jsonify({"error": "Intelligence core failed to respond. Please try again."}), 500

# Unified Resume Intelligence Retrieval
# (This route is handled by get_resume_analysis below)

import comparison

@app.route('/resume/<resume_id>', methods=['GET'])
@auth_required
def get_resume_analysis(resume_id):
    print(f"DEBUG - FETCHING ANALYSIS FOR: {resume_id}")
    user_id = request.user['user_id']
    row = db.get_latest_analysis_for_resume(resume_id, user_id)
    
    if not row:
        return jsonify({"error": "Analysis not found for this resume"}), 404
        
    res = dict(row)
    analysis_data = json.loads(res['detailed_json'])
    
    return jsonify({
        "resume_id": resume_id,
        "filename": res['filename'],
        "job_description": res['job_description'],
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
@auth_required
def analyze_stored_resume(resume_id):
    data = request.json
    job_description = data.get('job_description', '')
    
    if not job_description:
        return jsonify({"error": "No job description provided"}), 400
        
    # 1. Get resume text from DB (ensuring user ownership)
    user_id = request.user['user_id']
    resume = db.get_resume(resume_id, user_id)
    if not resume:
        return jsonify({"error": "Resume not found or unauthorized"}), 404
        
    # 2. Run analysis
    raw_analysis = llm.analyze_resume_ats(resume['raw_text'], job_description)
    analysis_data = clean_output(raw_analysis)
    
    # PHASE 1: Deterministic ATS Scoring
    ats_results = utils.calculate_ats_score(resume['raw_text'], job_description)
    analysis_data.update(ats_results)
    final_score = ats_results['ats_score']
    
    # 3. Save to History (ensuring user_id association)
    db.save_analysis(resume_id, user_id, job_description, final_score, analysis_data)
    
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
@auth_required
@require_role('hiring_manager')
def compare_resumes():
    data = request.json
    resume_ids = data.get('resume_ids', [])
    job_description = data.get('job_description', '')
    
    if not job_description or utils.is_gibberish(job_description):
        return jsonify({"error": "A valid, non-gibberish job description is required for accurate comparison"}), 400
        
    if not resume_ids or len(resume_ids) < 2:
        return jsonify({"error": "At least two resume_ids are required for comparison"}), 400
        
    user_id = request.user['user_id']
    resume_list = []
    for rid in resume_ids:
        r = db.get_resume(rid, user_id)
        if r: resume_list.append(r)
        
    if not resume_list:
        return jsonify({"error": "No valid resumes found for provided IDs"}), 404
        
    top_n = data.get('top_n')
    results = comparison.compare_resumes(resume_list, job_description, top_n)
    return jsonify(results)

@app.route('/compare-my-resumes', methods=['POST'])
@auth_required
def compare_my_resumes():
    data = request.json
    resume_ids = data.get('resume_ids', [])
    job_description = data.get('job_description', '')
    
    if not job_description or utils.is_gibberish(job_description):
        return jsonify({"error": "A valid job description is required"}), 400
        
    if not resume_ids or len(resume_ids) < 1:
        return jsonify({"error": "At least one resume is required for optimization"}), 400
        
    user_id = request.user['user_id']
    
    # Generate lightweight job descriptor record tracking user intent
    job_id = db.create_job(user_id, 'optimization', name="Resume Optimization")
    
    # Dispatch into the cluster with mapped Task ID for revocation control
    optimize_resumes_job.apply_async(args=[job_id, data, user_id], task_id=job_id)
    
    return jsonify({
        "jobId": job_id,
        "status": "pending",
        "message": "Optimization background task created successfully"
    })

@app.route('/history', methods=['GET'])
@auth_required
def get_analysis_history():
    user_id = request.user['user_id']
    history = db.get_history(user_id)
    return jsonify(history)

# --- LEGACY CHAT REMOVED (REPLACED WITH SESSIONS ABOVE) ---

# --- PHASE 1: JOB SYSTEM APIs ---

@app.route('/api/job/start', methods=['POST'])
@auth_required
def start_job():
    data = request.json
    job_type = data.get('type', 'ats')
    user_id = request.user['user_id']
    
    job_id = db.create_job(user_id, job_type, name=data.get('filename'))
    
    # PHASE 3: Dispatch to Scalable Queue (Celery/Redis) with mapped Task ID
    analyze_resume_job.apply_async(args=[job_id, data, user_id], task_id=job_id)
    
    return jsonify({"jobId": job_id, "status": "pending"})

@app.route('/api/job/<job_id>', methods=['GET'])
@auth_required
def get_job_status(job_id):
    job = db.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Security: Ensure user owns the job
    if job['user_id'] != request.user['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
    
    # Phase 8: Strict Access Control
    # If the job isn't completed, remove any partial result data
    if job['status'] != 'completed':
        job['result'] = None
        
    return jsonify(job)

@app.route('/api/jobs', methods=['GET'])
@auth_required
def get_all_jobs():
    user_id = request.user['user_id']
    jobs = db.get_all_user_jobs(user_id)
    return jsonify(jobs)

@app.route('/api/job/<job_id>/cancel', methods=['POST'])
@auth_required
def cancel_job(job_id):
    job = db.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    if job['user_id'] != request.user['user_id']:
        return jsonify({"error": "Unauthorized"}), 403
        
    if job['status'] in ['completed', 'failed', 'cancelled']:
        return jsonify({"message": "Job is already finished", "status": job['status']}), 200

    # 1. Update DB to visual state 'cancelled'
    db.update_job_status(job_id, 'cancelled', job['progress'])
    
    # 2. Send Celery revocation directive to broadcast pool cache.
    # Safer configuration for Windows/Eventlet compatibility.
    try:
        celery_app.control.revoke(job_id)
    except Exception as e:
        print(f"Celery revoke attempt triggered warning: {e}")

    # 3. Alert realtime web interfaces immediately
    socketio.emit(f'job:{job_id}', {'status': 'cancelled', 'message': 'Operation manually terminated by user'})

    return jsonify({"message": "Cancellation command issued", "status": "cancelled"})

# --- PHASE 8: NOTIFICATION APIs ---

@app.route('/api/notifications', methods=['GET'])
@auth_required
def get_notifications():
    only_unread = request.args.get('unread') == 'true'
    notifs = db.get_notifications(request.user['user_id'], only_unread)
    return jsonify(notifs)

@app.route('/api/notifications/unread-count', methods=['GET'])
@auth_required
def get_unread_count():
    count = db.get_unread_count(request.user['user_id'])
    return jsonify({"count": count})

@app.route('/api/notifications/<notif_id>/read', methods=['POST'])
@auth_required
def mark_read(notif_id):
    db.mark_notification_read(notif_id, request.user['user_id'])
    return jsonify({"success": True})

def process_job_background(job_id, data, user_id):
    """
    Refined Background worker for Phase 2.
    Processes the job and updates the SQLite database.
    """
    try:
        db.update_job_status(job_id, 'processing', 10)
        
        job_type = data.get('type')
        if job_type == 'ats':
            # 1. Parsing & Indexing
            db.update_job_status(job_id, 'processing', 20)
            resume_id = data.get('resume_id')
            text = data.get('resume_text')
            sections = utils.extract_sections(text)
            
            if data.get('persist'):
                db.save_resume({
                    "id": resume_id,
                    "filename": data.get('filename'),
                    "raw_text": text,
                    "doc_type": "resume",
                    "sections": sections
                }, user_id)
            
            rag.create_index(resume_id, text)
            
            # 2. LLM Analysis
            db.update_job_status(job_id, 'processing', 50)
            raw_analysis = llm.analyze_resume_ats(sections, data.get('job_description'))
            analysis_data = clean_output(raw_analysis)
            
            # 3. Deterministic ATS Scoring
            db.update_job_status(job_id, 'processing', 80)
            ats_results = utils.calculate_ats_score(text, data.get('job_description'), sections)
            analysis_data.update(ats_results)
            
            # 4. Save Analysis Result
            final_score = ats_results['ats_score']
            if data.get('persist'):
                db.save_analysis(resume_id, user_id, data.get('job_description'), final_score, analysis_data)
                
            # Finalize
            result = {
                "resume_id": resume_id,
                "filename": data.get('filename'),
                "sections": sections,
                **analysis_data
            }
            db.update_job_result(job_id, result)
            
        else:
            db.update_job_status(job_id, 'failed', 0)
            
    except Exception as e:
        print(f"JOB ERROR ({job_id}): {e}")
        db.update_job_status(job_id, 'failed', 0)

@app.route('/validate-jd', methods=['POST'])
@auth_required
def validate_jd():
    data = request.json
    jd = data.get('job_description', '')
    if not jd or utils.is_gibberish(jd):
        return jsonify({
            "valid": False, 
            "error": "The provided job description appears to be invalid or too short. Please provide more detail (minimum 10 words)."
        }), 400
    return jsonify({"valid": True})

@app.route('/analyze-advanced', methods=['POST'])
@auth_required
def analyze_advanced():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    file = request.files['resume']
    job_description = request.form.get('job_description', '')
    
    # Pre-validation
    if not job_description or utils.is_gibberish(job_description):
        return jsonify({"error": "The provided job description appears to be invalid or too short. Please provide a real job description."}), 400
        
    persist = request.form.get('persist', 'true').lower() == 'true'
    user_id = request.user['user_id']
    
    # Fast Extraction
    resume_id = str(uuid.uuid4())[:8]
    data_dir = os.path.join(BASE_DIR, "data")
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    temp_path = os.path.join(data_dir, f"temp_{resume_id}.pdf")
    file.save(temp_path)
    text = extract_text(temp_path)
    if os.path.exists(temp_path): os.remove(temp_path)

    # Create Job
    job_id = db.create_job(user_id, 'ats', name=file.filename)
    
    # Background Processing Data
    job_data = {
        "type": "ats",
        "filename": file.filename,
        "resume_text": text,
        "job_description": job_description,
        "persist": persist,
        "resume_id": resume_id
    }
    
    # PHASE 3: Enqueue to Redis with explicitly mapped task_id matching local db job_id
    analyze_resume_job.apply_async(args=[job_id, job_data, user_id], task_id=job_id)
    
    return jsonify({
        "jobId": job_id,
        "status": "pending",
        "message": "Analysis started in background"
    })

if __name__ == '__main__':
    print("Level 3 AI Resume Server Starting with WebSockets...")
    # use_reloader=False is critical on Windows with eventlet to prevent port lock
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)

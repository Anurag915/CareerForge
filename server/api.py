from gevent import monkey
monkey.patch_all()

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
import auth_utils
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import comparison

import cloudinary
import cloudinary.uploader
import cloudinary.api

cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

app = Flask(__name__)

# Hardened CORS: enable credential forwarding for secure HTTP-Only cookies!
CORS(app, resources={r"/*": {"origins": [auth_utils.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]}}, supports_credentials=True)

# Global DDoS Protection
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Browser Guard (Simulating Helmet Middleware)
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Unified Security configuration sourced from utilities
JWT_SECRET = auth_utils.JWT_SECRET
JWT_ALGORITHM = auth_utils.JWT_ALGORITHM

# Localized SSL/TLS Fix for Flask-SocketIO message queue (redis-py requires lowercase 'none')
RAW_REDIS = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
SOCKET_REDIS_URL = RAW_REDIS
if RAW_REDIS.startswith('rediss://') and 'ssl_cert_reqs' not in RAW_REDIS:
    separator = '&' if '?' in RAW_REDIS else '?'
    SOCKET_REDIS_URL = f"{RAW_REDIS}{separator}ssl_cert_reqs=none"

# Initialize Socket.IO with Redis as message queue for cross-process communication
socketio = SocketIO(app, cors_allowed_origins="*", message_queue=SOCKET_REDIS_URL, async_mode='gevent')

from flask_socketio import join_room

@socketio.on('join')
def on_join(data):
    user_id = data.get('user_id')
    if user_id:
        join_room(f"user_{user_id}")
        print(f"User {user_id} joined their notification room.")

def dispatch_job(job_func, job_id, data, user_id):
    """
    Intelligent Elastic Job Dispatcher.
    Hooks into Celery if REDIS_URL is provisioned, otherwise seamlessly cascades
    into a native Python Thread (No-Budget Infrastructure for Cloud Free Tiers!).
    """
    is_render = os.getenv('RENDER') == 'true'
    if os.getenv('REDIS_URL') and not is_render:
        job_func.apply_async(args=[job_id, data, user_id], task_id=job_id)
    else:
        import threading
        # Celery task callable executes standard underlying logic wrapper natively
        thread = threading.Thread(target=job_func, args=[job_id, data, user_id])
        thread.daemon = True
        thread.start()
        print(f"CLOUD FREE TIER FALLBACK: Executing {job_func.__name__} {job_id} on Native Daemon Thread.")

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

# --- PRODUCTION CUSTOM AUTH ENDPOINTS ---

@app.route('/signup', methods=['POST'])
@limiter.limit("5 per minute")
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

    # Secure Password Hash using C-implemented bcrypt
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create Cryptographically Secure Verification Link
    raw_token = auth_utils.generate_refresh_token() # Reuses 128char hex generator for extra safety
    hashed_token = auth_utils.hash_token(raw_token)
    expiry = datetime.datetime.utcnow() + datetime.timedelta(days=1) # Expires in 24 hours

    user_id = str(uuid.uuid4())[:8]
    success = db.save_user({
        "id": user_id,
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": role,
        "verification_token": hashed_token,
        "verification_token_expires": expiry
    })
    
    if not success:
        return jsonify({"error": "Email already registered"}), 400
        
    # Dispatch async Resend transaction
    email_sent = auth_utils.send_verification_email(email, raw_token)
    
    return jsonify({
        "message": "Registration successful. Please check your inbox to verify your email before logging in.",
        "email_status": "sent" if email_sent else "skipped (api key missing)"
    }), 201

@app.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.json
    raw_token = data.get('token')
    if not raw_token:
         return jsonify({"error": "Token parameter is missing"}), 400
         
    hashed_token = auth_utils.hash_token(raw_token)
    user = db.verify_user_email(hashed_token)
    
    if not user:
         return jsonify({"error": "Invalid, expired, or already verified token."}), 400
         
    return jsonify({"message": "Email verified successfully! You may now log in."}), 200

@app.route('/resend-verification', methods=['POST'])
@limiter.limit("3 per minute")
def resend_verification():
    data = request.json
    email = data.get('email')
    if not email:
         return jsonify({"error": "Email is required"}), 400
         
    user = db.get_user_by_email(email)
    if not user:
        return jsonify({"error": "No account associated with this email address"}), 404
        
    if user.get('is_verified'):
         return jsonify({"message": "Account is already verified. You may log in."}), 200
         
    raw_token = auth_utils.generate_refresh_token()
    hashed_token = auth_utils.hash_token(raw_token)
    expiry = datetime.datetime.utcnow() + datetime.timedelta(days=1)
    
    db.update_verification_token(email, hashed_token, expiry)
    auth_utils.send_verification_email(email, raw_token)
    
    return jsonify({"message": "A new verification link has been dispatched."}), 200

@app.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
        
    user = db.get_user_by_email(email)
    if not user:
        return jsonify({"error": "Invalid email or password credentials"}), 401
        
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({"error": "Invalid email or password credentials"}), 401
        
    # Gatekeep: Require Verification State
    if not user.get('is_verified', False):
         return jsonify({
             "error": "Email address not verified.", 
             "requires_verification": True,
             "email": user['email']
         }), 403
        
    # 1. Generate Short-lived Memory Token
    access_token = auth_utils.generate_access_token(user)
    
    # 2. Generate Secure Long-lived Database Token
    raw_refresh_token = auth_utils.generate_refresh_token()
    hashed_refresh = auth_utils.hash_token(raw_refresh_token)
    refresh_expiry = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    
    # 3. Commit to Secure Registry
    db.save_refresh_token(user['id'], hashed_refresh, refresh_expiry)
    
    # 4. Package client JSON
    resp = jsonify({
        "accessToken": access_token,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": user['role']
        }
    })
    
    # 5. Seal Hashed Token into HTTP-Only Secure Cookie
    resp.set_cookie(
        'refresh_token',
        raw_refresh_token,
        httponly=True,
        secure=True, # ALWAYS True in modern browser safety contexts
        samesite='None', # Allows cross-domain exchanges for separated API and Frontend stacks
        max_age=7 * 24 * 60 * 60 # 7 days
    )
    
    return resp

@app.route('/refresh', methods=['POST'])
def refresh_session():
    raw_old_refresh = request.cookies.get('refresh_token')
    if not raw_old_refresh:
         return jsonify({"error": "Session expired, please log in again"}), 401
         
    hashed_old_refresh = auth_utils.hash_token(raw_old_refresh)
    
    # Compute next rotation variables
    raw_new_refresh = auth_utils.generate_refresh_token()
    hashed_new_refresh = auth_utils.hash_token(raw_new_refresh)
    new_expiry = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    
    # Atomic Database rotation logic protects against double usage replays
    user_id = db.validate_and_revoke_refresh_token(hashed_old_refresh, hashed_new_refresh, new_expiry)
    
    if not user_id:
         resp = jsonify({"error": "Invalid session credentials"})
         resp.delete_cookie('refresh_token')
         return resp, 401
         
    user = db.get_user_by_id(user_id)
    if not user:
         return jsonify({"error": "User account suspended"}), 401
         
    # Create new Access Token
    new_access_token = auth_utils.generate_access_token(user)
    
    resp = jsonify({
        "accessToken": new_access_token,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": user['role']
        }
    })
    
    # Seat rotated cookie
    resp.set_cookie(
        'refresh_token',
        raw_new_refresh,
        httponly=True,
        secure=True,
        samesite='None',
        max_age=7 * 24 * 60 * 60
    )
    return resp

@app.route('/logout', methods=['POST'])
def logout():
    raw_refresh = request.cookies.get('refresh_token')
    if raw_refresh:
         hashed_refresh = auth_utils.hash_token(raw_refresh)
         db.revoke_refresh_token(hashed_refresh)
         
    resp = jsonify({"message": "Successfully logged out."})
    resp.delete_cookie('refresh_token', samesite='None', secure=True)
    return resp

@app.route('/logout-all', methods=['POST'])
@auth_required
def logout_all_sessions():
    db.revoke_all_user_sessions(request.user['user_id'])
    resp = jsonify({"message": "Successfully terminated all device sessions."})
    resp.delete_cookie('refresh_token', samesite='None', secure=True)
    return resp

@app.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per minute")
def forgot_password():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({"error": "Email address is required"}), 400
        
    user = db.get_user_by_email(email)
    # Security Hardening: Return identical messages to avoid account enumeration attacks!
    dummy_response = jsonify({"message": "If an account matches this email, a secure reset link has been sent."})
    
    if not user:
        return dummy_response, 200
        
    raw_reset = auth_utils.generate_refresh_token()
    hashed_reset = auth_utils.hash_token(raw_reset)
    expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1) # Hard limit to 1 hour
    
    db.set_password_reset_token(email, hashed_reset, expiry)
    auth_utils.send_reset_password_email(email, raw_reset)
    
    return dummy_response, 200

@app.route('/reset-password', methods=['POST'])
@limiter.limit("5 per minute")
def reset_password():
    data = request.json
    raw_token = data.get('token')
    new_password = data.get('password')
    
    if not raw_token or not new_password:
         return jsonify({"error": "Reset token and new password are required."}), 400
         
    # Strong validation: ensure minimum lengths
    if len(new_password) < 6:
         return jsonify({"error": "Password must reside at 6 characters minimum."}), 400
         
    hashed_new_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    hashed_token = auth_utils.hash_token(raw_token)
    
    success = db.reset_user_password(hashed_token, hashed_new_password)
    
    if not success:
         return jsonify({"error": "Reset token is invalid or expired."}), 400
         
    return jsonify({"message": "Credentials updated successfully. Please log in."}), 200

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

        pdf_url = None
        if persist:
            try:
                print(f"DEBUG: Attempting Cloudinary upload for {file.filename}")
                # Upload to Cloudinary securely as raw file to preserve PDF mimetype and CORS headers
                upload_result = cloudinary.uploader.upload(temp_path, resource_type="raw", folder="CareerForge")
                pdf_url = upload_result.get("secure_url")
                print(f"DEBUG: Cloudinary upload successful. secure_url: {pdf_url}")
                
                if upload_result and not pdf_url:
                    print("WARNING: Cloudinary upload succeeded but secure_url is missing from response!")
                    raise ValueError("Cloudinary upload succeeded but secure_url is missing.")
            except Exception as ce:
                print(f"Cloudinary Upload Error: {ce}")

        # 1. Parse Sections
        sections = extract_sections(text)
        
        # 2. Save to DB
        user_id = request.user['user_id']
        resume_data = {
            "id": resume_id,
            "filename": file.filename,
            "raw_text": text,
            "doc_type": doc_type,
            "sections": sections,
            "pdf_url": pdf_url
        }
        if persist:
            db.save_resume(resume_data, user_id)
        
        # 3. Create RAG Index (Per-doc + Global)
        rag.create_index(resume_id, text, doc_type)
        
        return jsonify({
            "message": "Document uploaded and indexed successfully",
            "resume_id": resume_id,
            "doc_type": doc_type,
            "filename": file.filename,
            "pdf_url": pdf_url
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
        
    # 1. Get context from Global FAISS Index with Self-Healing Recovery
    context = rag.query_global_index(question)
    
    # SELF-HEALING: If global index got wiped from Render ephemeral storage, auto-rebuild!
    if not context or context == "No documents indexed yet." or not os.path.exists(rag.GLOBAL_INDEX_PATH):
        try:
            print("SELF-HEALING: Global FAISS index missing. Dynamically recovering from persistent database...")
            user_id = request.user['user_id']
            all_resumes = db.get_all_resumes(user_id)
            for resume_stub in all_resumes:
                # Fetch full body with raw_text and re-insert to global pool
                full_r = db.get_resume(resume_stub['id'], user_id)
                if full_r and full_r.get('raw_text'):
                    rag.add_to_global_index(full_r['id'], full_r.get('doc_type', 'resume'), full_r['raw_text'])
            
            # Query once more now that memory is healed
            context = rag.query_global_index(question)
            print("SELF-HEALING SUCCESS: Master global vector database restored!")
        except Exception as e:
            print(f"Global index recovery triggered exception: {e}")
    
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
    
    # 2. Context Sourcing from RAG with Self-Healing Fault Tolerance
    context = ""
    if context_resume_id and context_resume_id != "global":
        try:
            context = rag.query_index(context_resume_id, prompt)
            
            # SELF-HEALING: If Render ephemeral disk wiped the vectors, auto-rebuild from PostgreSQL!
            if not context:
                print(f"SELF-HEALING: FAISS index missing for {context_resume_id}. Rebuilding on-the-fly...")
                resume = db.get_resume(context_resume_id, user_id)
                if resume and resume.get('raw_text'):
                    # Re-index (<0.1s) and requery instantly
                    rag.create_index(context_resume_id, resume['raw_text'], doc_type=resume.get('doc_type', 'resume'))
                    context = rag.query_index(context_resume_id, prompt)
                    print(f"SELF-HEALING SUCCESS: Vector store restored for {context_resume_id}!")
        except Exception as e:
            print(f"RAG retrieval/healing fail for {context_resume_id}: {e}")
    
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
        "pdf_url": resume.get('pdf_url'),
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
def compare_resumes():
    data = request.json
    resume_ids = data.get('resume_ids', [])
    job_description = data.get('job_description', '')
    
    if not job_description or utils.is_gibberish(job_description):
        return jsonify({"error": "A valid, non-gibberish job description is required for accurate comparison"}), 400
        
    if not resume_ids or len(resume_ids) < 2:
        return jsonify({"error": "At least two resume_ids are required for comparison"}), 400
        
    user_id = request.user['user_id']
    job_id = db.create_job(user_id, 'comparison', name=f"Comparing {len(resume_ids)} Candidates")
    
    # Initialize persistent comparison record synchronously
    db.create_comparison_record(job_id, user_id, job_description)
    db.initialize_comparison_results(job_id, resume_ids)
    
    # Dispatch into the cluster or fallback thread
    from tasks import compare_resumes_job
    dispatch_job(compare_resumes_job, job_id, data, user_id)
    
    return jsonify({
        "jobId": job_id,
        "status": "pending",
        "message": "Comparison background task created successfully"
    })

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
    
    # Dispatch into the cluster or fallback thread
    dispatch_job(optimize_resumes_job, job_id, data, user_id)
    
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

@app.route('/api/comparisons', methods=['GET'])
@auth_required
def get_comparisons():
    user_id = request.user['user_id']
    history = db.get_comparison_history(user_id)
    return jsonify(history)

@app.route('/api/comparisons/<comparison_id>', methods=['GET'])
@auth_required
def get_comparison_detail(comparison_id):
    user_id = request.user['user_id']
    detail = db.get_comparison_detail(comparison_id, user_id)
    if not detail:
        return jsonify({"error": "Comparison not found or unauthorized"}), 404
    return jsonify(detail)

# --- LEGACY CHAT REMOVED (REPLACED WITH SESSIONS ABOVE) ---

# --- PHASE 1: JOB SYSTEM APIs ---

@app.route('/api/job/analyze-existing', methods=['POST'])
@auth_required
def analyze_existing_job():
    data = request.json
    resume_id = data.get('resume_id')
    job_description = data.get('job_description', '')
    
    if not resume_id or not job_description:
        return jsonify({"error": "Resume ID and job description are required"}), 400
        
    user_id = request.user['user_id']
    resume = db.get_resume(resume_id, user_id)
    
    if not resume:
        return jsonify({"error": "Resume not found or unauthorized"}), 404
        
    job_id = db.create_job(user_id, 'ats', name=resume['filename'])
    
    job_data = {
        "type": "ats",
        "resume_id": resume_id,
        "resume_text": resume['raw_text'],
        "filename": resume['filename'],
        "job_description": job_description,
        "persist": False # Already in vault
    }
    
    dispatch_job(analyze_resume_job, job_id, job_data, user_id)
    
    return jsonify({"jobId": job_id, "status": "pending"})

@app.route('/api/job/start', methods=['POST'])
@auth_required
def start_job():
    data = request.json
    job_type = data.get('type', 'ats')
    user_id = request.user['user_id']
    
    job_id = db.create_job(user_id, job_type, name=data.get('filename'))
    
    # PHASE 3: Dispatch to Scalable Queue (Celery/Redis) or native cloud fallback
    dispatch_job(analyze_resume_job, job_id, data, user_id)
    
    return jsonify({"jobId": job_id, "status": "pending"})

@app.route('/api/job/<job_id>', methods=['GET'])
@limiter.exempt
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
@limiter.exempt
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
    pdf_url = None
    if persist:
        try:
            # Upload to Cloudinary securely as raw file to preserve PDF mimetype and CORS headers
            upload_result = cloudinary.uploader.upload(temp_path, resource_type="raw", folder="CareerForge")
            pdf_url = upload_result.get("secure_url")
        except Exception as ce:
            print(f"Cloudinary Upload Error: {ce}")

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
        "resume_id": resume_id,
        "pdf_url": pdf_url
    }
    
    # PHASE 3: Enqueue to Redis or native fallback thread
    dispatch_job(analyze_resume_job, job_id, job_data, user_id)
    
    return jsonify({
        "jobId": job_id,
        "status": "pending",
        "message": "Analysis started in background"
    })

if __name__ == '__main__':
    print("Level 3 AI Resume Server Starting with WebSockets...")
    # use_reloader=False is critical on Windows with eventlet to prevent port lock
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)

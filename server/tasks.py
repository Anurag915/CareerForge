from celery_app import celery_app
from flask_socketio import SocketIO
import os
import db
import utils
import llm
import rag
import json
from utils import clean_output
import comparison

# Localized SSL/TLS Fix for worker Flask-SocketIO emitter (redis-py requires lowercase 'none')
RAW_REDIS = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
SOCKET_REDIS_URL = RAW_REDIS
if RAW_REDIS.startswith('rediss://') and 'ssl_cert_reqs' not in RAW_REDIS:
    separator = '&' if '?' in RAW_REDIS else '?'
    SOCKET_REDIS_URL = f"{RAW_REDIS}{separator}ssl_cert_reqs=none"

# Phase 4: External Emitter for Celery Workers
socket_emitter = SocketIO(message_queue=SOCKET_REDIS_URL)

@celery_app.task(name='tasks.analyze_resume_job')
def analyze_resume_job(job_id, data, user_id):
    """
    Phase 3 Scalable Worker (Celery).
    Replaces process_job_background for reliability and scaling.
    """
    try:
        db.update_job_status(job_id, 'Reading your resume', 10)
        socket_emitter.emit(f'job:{job_id}', {'status': 'Reading your resume', 'progress': 10, 'message': 'Reading your resume'})
        
        # 1. Parsing & Indexing
        db.update_job_status(job_id, 'Extracting key skills', 30)
        socket_emitter.emit(f'job:{job_id}', {'status': 'Extracting key skills', 'progress': 30, 'message': 'Extracting key skills'})
        
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
        
        db.update_job_status(job_id, 'Matching with job description', 60)
        socket_emitter.emit(f'job:{job_id}', {'status': 'Matching with job description', 'progress': 60, 'message': 'Matching with job description'})
        rag.create_index(resume_id, text)
        
        # Safe Early-Exit: Check if user cancelled during initial indexing
        j_check = db.get_job(job_id)
        if j_check and j_check.get('status') == 'cancelled':
            print(f"Job {job_id} gracefully self-terminated via user cancel.")
            return {"status": "cancelled", "job_id": job_id}
        
        # 2. LLM Analysis
        db.update_job_status(job_id, 'Analyzing experience', 80)
        socket_emitter.emit(f'job:{job_id}', {'status': 'Analyzing experience', 'progress': 80, 'message': 'Analyzing experience'})
        raw_analysis = llm.analyze_resume_ats(sections, data.get('job_description'))
        analysis_data = clean_output(raw_analysis)
        
        # 3. Deterministic ATS Scoring
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
        
        # Phase 8: Create Notification
        notif_msg = f"Analysis for {data.get('filename')} is complete."
        db.create_notification(user_id, job_id, notif_msg)
        socket_emitter.emit('notification:new', {'user_id': user_id, 'message': notif_msg}, room=f"user_{user_id}")
        
        socket_emitter.emit(f'job:{job_id}', {'status': 'completed', 'progress': 100, 'result': result, 'message': 'Finalizing results'})
        return {"status": "success", "job_id": job_id}
        
    except Exception as e:
        print(f"CELERY WORKER ERROR in Job {job_id}: {e}")
        friendly_error = f"We encountered an issue analyzing {data.get('filename')}. Please try uploading again."
        db.update_job_status(job_id, 'failed', 0)
        db.create_notification(user_id, job_id, friendly_error)
        socket_emitter.emit('notification:new', {'user_id': user_id, 'message': friendly_error}, room=f"user_{user_id}")
        
        socket_emitter.emit(f'job:{job_id}', {'status': 'failed', 'progress': 0, 'error': friendly_error})
        return {"status": "error", "error": friendly_error}

@celery_app.task(name='tasks.optimize_resumes_job')
def optimize_resumes_job(job_id, data, user_id):
    """
    Asynchronous task for bulk resume optimization & comparisons.
    Runs comparisons inside queue, decoupling memory-intense LLM calls from main API thread.
    """
    try:
        db.update_job_status(job_id, 'Validating documents', 10)
        socket_emitter.emit(f'job:{job_id}', {'status': 'Validating documents', 'progress': 10})
        
        resume_ids = data.get('resume_ids', [])
        job_description = data.get('job_description', '')
        
        resume_list = []
        for rid in resume_ids:
            r = db.get_resume(rid, user_id)
            if r:
                resume_list.append(r)
                
        if len(resume_list) < 1:
            raise ValueError("Insufficient accessible resumes for optimization analysis.")
            
        db.update_job_status(job_id, 'Calculating ATS weights', 40)
        socket_emitter.emit(f'job:{job_id}', {'status': 'Calculating ATS weights', 'progress': 40})
        
        # Safe Early-Exit: Check if user cancelled before invoking heavy comparative LLM logic
        j_check = db.get_job(job_id)
        if j_check and j_check.get('status') == 'cancelled':
            print(f"Optimization {job_id} gracefully self-terminated.")
            return {"status": "cancelled", "job_id": job_id}
        
        # Standard heavy computation call
        # Note: We increment internally if needed inside comparison.py, but standard usage is bulk
        raw_results = comparison.compare_resumes(resume_list, job_description)
        
        db.update_job_status(job_id, 'Synthesizing AI recommendations', 80)
        socket_emitter.emit(f'job:{job_id}', {'status': 'Synthesizing AI recommendations', 'progress': 80})
        
        # Formatting results payload to map front-end expectations
        best_resume = raw_results['metrics'][0] if raw_results.get('metrics') else None
        final_result = {
            "best_resume_id": best_resume['id'] if best_resume else None,
            "ranking": raw_results.get('metrics', []),
            "ai_explanation": raw_results.get('llm_analysis', {}),
            "job_description_preview": job_description[:100] + ("..." if len(job_description) > 100 else "")
        }
        
        db.update_job_result(job_id, final_result)
        
        notif_msg = f"Your resume optimization comparison is ready."
        db.create_notification(user_id, job_id, notif_msg)
        socket_emitter.emit('notification:new', {'user_id': user_id, 'message': notif_msg}, room=f"user_{user_id}")
        
        socket_emitter.emit(f'job:{job_id}', {'status': 'completed', 'progress': 100, 'result': final_result})
        return {"status": "success", "job_id": job_id}
        
    except Exception as e:
        print(f"CELERY OPTIMIZATION ERROR: {e}")
        friendly_error = f"We encountered an error during optimization: {str(e)}"
        db.update_job_status(job_id, 'failed', 0)
        socket_emitter.emit(f'job:{job_id}', {'status': 'failed', 'progress': 0, 'error': friendly_error})
        return {"status": "error", "error": friendly_error}


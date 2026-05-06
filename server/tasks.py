from celery_app import celery_app
from flask_socketio import SocketIO
import os
import db
import utils
import llm
import rag
import json
from utils import clean_output

# Phase 4: External Emitter for Celery Workers
socket_emitter = SocketIO(message_queue=os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

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

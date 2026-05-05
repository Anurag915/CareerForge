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
        db.update_job_status(job_id, 'processing', 10)
        
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
        socket_emitter.emit(f'job:{job_id}', {'status': 'processing', 'progress': 20, 'message': 'Skills and Sections analyzed'})
        
        # 2. LLM Analysis
        db.update_job_status(job_id, 'processing', 50)
        raw_analysis = llm.analyze_resume_ats(sections, data.get('job_description'))
        analysis_data = clean_output(raw_analysis)
        socket_emitter.emit(f'job:{job_id}', {'status': 'processing', 'progress': 50, 'message': 'AI Critique and Experience Analysis complete'})
        
        # 3. Deterministic ATS Scoring
        db.update_job_status(job_id, 'processing', 80)
        ats_results = utils.calculate_ats_score(text, data.get('job_description'), sections)
        analysis_data.update(ats_results)
        socket_emitter.emit(f'job:{job_id}', {'status': 'processing', 'progress': 80, 'message': 'ATS Score calculated'})
        
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
        
        socket_emitter.emit(f'job:{job_id}', {'status': 'completed', 'progress': 100, 'result': result})
        return {"status": "success", "job_id": job_id}
        
    except Exception as e:
        print(f"CELERY WORKER ERROR in Job {job_id}: {e}")
        error_msg = f"Analysis failed for {data.get('filename')}: {str(e)}"
        db.update_job_status(job_id, 'failed', 0)
        db.create_notification(user_id, job_id, error_msg)
        socket_emitter.emit('notification:new', {'user_id': user_id, 'message': error_msg}, room=f"user_{user_id}")
        
        socket_emitter.emit(f'job:{job_id}', {'status': 'failed', 'progress': 0, 'error': str(e)})
        return {"status": "error", "error": str(e)}

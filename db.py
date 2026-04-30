import sqlite3
import json
import os

DB_PATH = "data/resume_analyzer.db"

def init_db():
    if not os.path.exists("data"):
        os.makedirs("data")
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Resumes (now generic Documents) table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resumes (
            id TEXT PRIMARY KEY,
            filename TEXT,
            raw_text TEXT,
            doc_type TEXT DEFAULT 'resume',
            summary TEXT,
            skills TEXT,
            experience TEXT,
            education TEXT,
            projects TEXT,
            achievements TEXT,
            other_sections TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Analysis results table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id TEXT,
            job_description TEXT,
            ats_score INTEGER,
            detailed_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resume_id) REFERENCES resumes (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def save_resume(resume_data):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO resumes (id, filename, raw_text, doc_type, summary, skills, experience, education, projects, achievements, other_sections)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        resume_data['id'], 
        resume_data['filename'], 
        resume_data['raw_text'],
        resume_data.get('doc_type', 'resume'),
        resume_data['sections'].get('summary', ''),
        resume_data['sections'].get('skills', ''),
        resume_data['sections'].get('experience', ''),
        resume_data['sections'].get('education', ''),
        resume_data['sections'].get('projects', ''),
        resume_data['sections'].get('achievements', ''),
        json.dumps(resume_data['sections'].get('other_sections', {}))
    ))
    conn.commit()
    conn.close()

def get_all_resumes():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT id, filename, created_at FROM resumes ORDER BY created_at DESC')
    resumes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return resumes

def get_resume(resume_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM resumes WHERE id = ?', (resume_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def save_analysis(resume_id, job_description, ats_score, detailed_json):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO analysis_results (resume_id, job_description, ats_score, detailed_json)
        VALUES (?, ?, ?, ?)
    ''', (resume_id, job_description, ats_score, json.dumps(detailed_json)))
    conn.commit()
    conn.close()

def get_history():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''
        SELECT a.id, a.resume_id, r.filename, a.job_description, a.ats_score, a.detailed_json, a.created_at
        FROM analysis_results a
        JOIN resumes r ON a.resume_id = r.id
        ORDER BY a.id DESC
    ''')
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

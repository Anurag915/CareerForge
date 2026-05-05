import sqlite3
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "resume_analyzer.db")

def init_db():
    data_dir = os.path.join(BASE_DIR, "data")
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'candidate',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Resumes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resumes (
            id TEXT PRIMARY KEY,
            user_id TEXT,
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Analysis results table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id TEXT,
            user_id TEXT,
            job_description TEXT,
            ats_score REAL,
            detailed_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resume_id) REFERENCES resumes (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Jobs table [PHASE 1/8]
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            type TEXT, -- 'ats' or 'optimization'
            status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
            progress INTEGER DEFAULT 0,
            result TEXT, -- JSON string
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Ensure columns exist for legacy DBs [PHASE 8]
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN started_at TIMESTAMP")
    except sqlite3.OperationalError: pass
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN completed_at TIMESTAMP")
    except sqlite3.OperationalError: pass

    # Notifications table [PHASE 8]
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            job_id TEXT,
            message TEXT,
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (job_id) REFERENCES jobs (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def save_user(user_data):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO users (id, name, email, password, role)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_data['id'], user_data['name'], user_data['email'], user_data['password'], user_data.get('role', 'candidate')))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_user_by_email(email):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def save_resume(resume_data, user_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO resumes (id, user_id, filename, raw_text, doc_type, summary, skills, experience, education, projects, achievements, other_sections)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        resume_data['id'], 
        user_id,
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

def get_all_resumes(user_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT id, filename, created_at FROM resumes WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
    resumes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return resumes

def get_resume(resume_id, user_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM resumes WHERE id = ? AND user_id = ?', (resume_id, user_id))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def save_analysis(resume_id, user_id, job_description, ats_score, detailed_json):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO analysis_results (resume_id, user_id, job_description, ats_score, detailed_json)
        VALUES (?, ?, ?, ?, ?)
    ''', (resume_id, user_id, job_description, ats_score, json.dumps(detailed_json)))
    conn.commit()
    conn.close()

def get_history(user_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''
        SELECT a.id, a.resume_id, r.filename, a.job_description, a.ats_score, a.detailed_json, a.created_at
        FROM analysis_results a
        JOIN resumes r ON a.resume_id = r.id
        WHERE a.user_id = ?
        ORDER BY a.id DESC
    ''', (user_id,))
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

def save_chat_message(user_id, role, content, resume_id=None):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO chat_messages (user_id, role, content, resume_id)
            VALUES (?, ?, ?, ?)
        ''', (user_id, role, content, resume_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving chat message: {e}")
        return False

def get_chat_history(user_id, resume_id=None):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if resume_id:
            cursor.execute('''
                SELECT role, content, created_at
                FROM chat_messages
                WHERE user_id = ? AND resume_id = ?
                ORDER BY created_at ASC
            ''', (user_id, resume_id))
        else:
            cursor.execute('''
                SELECT role, content, created_at
                FROM chat_messages
                WHERE user_id = ? AND resume_id IS NULL
                ORDER BY created_at ASC
            ''', (user_id,))
            
        messages = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return messages
    except Exception as e:
        print(f"Error getting chat history: {e}")
        return []
    return history
# --- PHASE 1: JOB SYSTEM UTILITIES ---

def create_job(user_id, job_type):
    import uuid
    job_id = str(uuid.uuid4())
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO jobs (id, user_id, type, status)
        VALUES (?, ?, ?, 'pending')
    ''', (job_id, user_id, job_type))
    conn.commit()
    conn.close()
    return job_id

def update_job_status(job_id, status, progress=0):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if status == 'processing':
        cursor.execute('''
            UPDATE jobs SET status = ?, progress = ?, started_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND started_at IS NULL
        ''', (status, progress, job_id))
    else:
        cursor.execute('''
            UPDATE jobs SET status = ?, progress = ? WHERE id = ?
        ''', (status, progress, job_id))
    conn.commit()
    conn.close()

def update_job_result(job_id, result_dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE jobs SET status = 'completed', progress = 100, result = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?
    ''', (json.dumps(result_dict), job_id))
    conn.commit()
    conn.close()

def get_job(job_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM jobs WHERE id = ?', (job_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        res = dict(row)
        if res['result']:
            res['result'] = json.loads(res['result'])
        return res
    return None

# --- NOTIFICATION UTILS [PHASE 8] ---

def create_notification(user_id, job_id, message):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    import uuid
    notif_id = str(uuid.uuid4())
    cursor.execute('INSERT INTO notifications (id, user_id, job_id, message) VALUES (?, ?, ?, ?)',
                   (notif_id, user_id, job_id, message))
    conn.commit()
    conn.close()
    return notif_id

def get_notifications(user_id, only_unread=False):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    query = 'SELECT * FROM notifications WHERE user_id = ?'
    if only_unread:
        query += ' AND is_read = 0'
    query += ' ORDER BY created_at DESC LIMIT 50'
    cursor.execute(query, (user_id,))
    notifs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return notifs

def mark_notification_read(notif_id, user_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', (notif_id, user_id))
    conn.commit()
    conn.close()

def get_unread_count(user_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0', (user_id,))
    count = cursor.fetchone()[0]
    conn.close()
    return count

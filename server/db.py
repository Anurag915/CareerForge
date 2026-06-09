import psycopg2
from psycopg2.extras import RealDictCursor
import json
import os
from dotenv import load_dotenv

# Bulletproof Pathing: Always find the .env relative to this python file's location
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, '.env')
load_dotenv(dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    """
    Establishes connection to Postgres using the DATABASE_URL from environment.
    """
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set in your .env file!")
    
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def init_db():
    conn = get_db_connection()
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
            pdf_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Analysis results table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            id SERIAL PRIMARY KEY,
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

    # Jobs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            type TEXT,
            name TEXT,
            status TEXT DEFAULT 'pending',
            progress INTEGER DEFAULT 0,
            result TEXT,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Notifications table
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

    # Chat Sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Chat Messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            role TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
        )
    ''')

    # === CUSTOM SAAS AUTH UPGRADES ===
    # 1. Dynamic User Columns Migration
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE")
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT")
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP")
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT")
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP")
    cursor.execute("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS pdf_url TEXT")

    # 2. Refresh Tokens Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            token_hash TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')

    # 3. Persistent Comparison History Tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comparison_jobs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            status TEXT DEFAULT 'processing',
            job_description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comparison_results (
            id SERIAL PRIMARY KEY,
            comparison_id TEXT NOT NULL,
            resume_id TEXT NOT NULL,
            score REAL,
            rank INTEGER,
            analysis_data TEXT,
            FOREIGN KEY (comparison_id) REFERENCES comparison_jobs (id) ON DELETE CASCADE,
            FOREIGN KEY (resume_id) REFERENCES resumes (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

def save_user(user_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO users (id, name, email, password, role, verification_token, verification_token_expires)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (
            user_data['id'], 
            user_data['name'], 
            user_data['email'], 
            user_data['password'], 
            user_data.get('role', 'candidate'),
            user_data.get('verification_token'),
            user_data.get('verification_token_expires')
        ))
        conn.commit()
        return True
    except Exception as e:
        print(f"DB DEBUG: Error saving user: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def save_resume(resume_data, user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO resumes (id, user_id, filename, raw_text, doc_type, summary, skills, experience, education, projects, achievements, other_sections, pdf_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            filename = EXCLUDED.filename,
            raw_text = EXCLUDED.raw_text,
            doc_type = EXCLUDED.doc_type,
            summary = EXCLUDED.summary,
            skills = EXCLUDED.skills,
            experience = EXCLUDED.experience,
            education = EXCLUDED.education,
            projects = EXCLUDED.projects,
            achievements = EXCLUDED.achievements,
            other_sections = EXCLUDED.other_sections,
            pdf_url = COALESCE(EXCLUDED.pdf_url, resumes.pdf_url)
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
        json.dumps(resume_data['sections'].get('other_sections', {})),
        resume_data.get('pdf_url')
    ))
    conn.commit()
    conn.close()

def get_all_resumes(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT id, filename, created_at, pdf_url FROM resumes WHERE user_id = %s ORDER BY created_at DESC', (user_id,))
    resumes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return resumes

def get_resume(resume_id, user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT * FROM resumes WHERE id = %s AND user_id = %s', (resume_id, user_id))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def save_analysis(resume_id, user_id, job_description, ats_score, detailed_json):
    import datetime
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.datetime.utcnow()
    cursor.execute('''
        INSERT INTO analysis_results (resume_id, user_id, job_description, ats_score, detailed_json, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    ''', (resume_id, user_id, job_description, ats_score, json.dumps(detailed_json), now))
    conn.commit()
    conn.close()

def get_history(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('''
        SELECT a.id, a.resume_id, r.filename, a.job_description, a.ats_score, a.detailed_json, a.created_at
        FROM analysis_results a
        JOIN resumes r ON a.resume_id = r.id
        WHERE a.user_id = %s
        ORDER BY a.id DESC
    ''', (user_id,))
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

# --- MIGRATED FROM API.PY (CENTRALIZED ACCESS) ---

def get_latest_analysis_for_resume(resume_id, user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('''
        SELECT a.detailed_json, a.job_description, r.filename, a.ats_score, r.summary, r.skills, r.experience, r.education, r.projects, r.achievements, r.other_sections
        FROM analysis_results a
        JOIN resumes r ON a.resume_id = r.id
        WHERE a.resume_id = %s AND a.user_id = %s
        ORDER BY a.created_at DESC LIMIT 1
    ''', (resume_id, user_id))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_user_jobs(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('''
        SELECT id, type, name, status, progress, created_at, started_at, completed_at 
        FROM jobs WHERE user_id = %s ORDER BY created_at DESC
    ''', (user_id,))
    jobs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jobs

# --- LEGACY/HIDDEN CHAT COLLISION MIGRATION (Preserved to match git history) ---

def save_chat_message(user_id, role, content, resume_id=None):
    """ 
    LEGACY SIGNATURE. NOTE: In active codebase, this matches lines 224-237.
    Will likely fail on execution as schema differs, but preserved for state sync.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO chat_messages (user_id, role, content, resume_id)
            VALUES (%s, %s, %s, %s)
        ''', (user_id, role, content, resume_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"DB DEBUG: Error in legacy chat insert: {e}")
        return False

def get_chat_history(user_id, resume_id=None):
    """
    LEGACY SIGNATURE. NOTE: Preserves structure from lines 239-266.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        if resume_id:
            cursor.execute('''
                SELECT role, content, created_at FROM chat_messages
                WHERE user_id = %s AND resume_id = %s ORDER BY created_at ASC
            ''', (user_id, resume_id))
        else:
            cursor.execute('''
                SELECT role, content, created_at FROM chat_messages
                WHERE user_id = %s AND resume_id IS NULL ORDER BY created_at ASC
            ''', (user_id,))
        messages = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return messages
    except Exception as e:
        print(f"DB DEBUG: Error getting legacy history: {e}")
        return []

# --- JOB SYSTEM UTILITIES ---

def create_job(user_id, job_type, name=None):
    import uuid
    import datetime
    job_id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.datetime.utcnow()
    cursor.execute('''
        INSERT INTO jobs (id, user_id, type, name, status, created_at)
        VALUES (%s, %s, %s, %s, 'pending', %s)
    ''', (job_id, user_id, job_type, name, now))
    conn.commit()
    conn.close()
    return job_id

def update_job_status(job_id, status, progress=0):
    import datetime
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.datetime.utcnow()
    if status not in ['completed', 'failed', 'pending', 'cancelled']:
        cursor.execute('''
            UPDATE jobs SET status = %s, progress = %s, started_at = %s 
            WHERE id = %s AND started_at IS NULL
        ''', (status, progress, now, job_id))
        cursor.execute('''
            UPDATE jobs SET status = %s, progress = %s WHERE id = %s
        ''', (status, progress, job_id))
    else:
        cursor.execute('''
            UPDATE jobs SET status = %s, progress = %s WHERE id = %s
        ''', (status, progress, job_id))
    conn.commit()
    conn.close()

def update_job_result(job_id, result_dict):
    import datetime
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.datetime.utcnow()
    cursor.execute('''
        UPDATE jobs SET status = 'completed', progress = 100, result = %s, completed_at = %s WHERE id = %s
    ''', (json.dumps(result_dict), now, job_id))
    conn.commit()
    conn.close()

def get_job(job_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT * FROM jobs WHERE id = %s', (job_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# --- COMPARISON HISTORY ---

def create_comparison_record(comparison_id, user_id, job_description):
    import datetime
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.datetime.utcnow()
    cursor.execute('''
        INSERT INTO comparison_jobs (id, user_id, status, job_description, created_at)
        VALUES (%s, %s, 'processing', %s, %s)
    ''', (comparison_id, user_id, job_description, now))
    conn.commit()
    conn.close()

def save_comparison_results(comparison_id, results_payload):
    import datetime
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.datetime.utcnow()
    
    # Update overarching job status
    cursor.execute('''
        UPDATE comparison_jobs SET status = 'completed', completed_at = %s WHERE id = %s
    ''', (now, comparison_id))
    
    metrics = results_payload.get('metrics', [])
    llm_analysis = results_payload.get('llm_analysis', {})
    
    for rank, candidate in enumerate(metrics, start=1):
        score = candidate.get('ats_score')
        resume_id = candidate.get('id')
        
        cursor.execute('''
            INSERT INTO comparison_results (comparison_id, resume_id, score, rank, analysis_data)
            VALUES (%s, %s, %s, %s, %s)
        ''', (comparison_id, resume_id, score, rank, json.dumps(results_payload)))
        
    conn.commit()
    conn.commit()
    conn.close()

def get_comparison_history(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('''
        SELECT c.id, c.status, c.job_description, c.created_at, COUNT(r.id) as resumes_count
        FROM comparison_jobs c
        LEFT JOIN comparison_results r ON c.id = r.comparison_id
        WHERE c.user_id = %s
        GROUP BY c.id
        ORDER BY c.created_at DESC
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_comparison_detail(comparison_id, user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Verify ownership and get base job
    cursor.execute('''
        SELECT * FROM comparison_jobs 
        WHERE id = %s AND user_id = %s
    ''', (comparison_id, user_id))
    job = cursor.fetchone()
    
    if not job:
        conn.close()
        return None
        
    job_dict = dict(job)
    
    # Get all results for this job
    cursor.execute('''
        SELECT cr.*, r.filename 
        FROM comparison_results cr
        JOIN resumes r ON cr.resume_id = r.id
        WHERE cr.comparison_id = %s
        ORDER BY cr.rank ASC
    ''', (comparison_id,))
    results = cursor.fetchall()
    conn.close()
    
    # The actual deep metrics JSON was stored in analysis_data
    # We can reconstruct it or just pass the rows
    job_dict['results'] = []
    for r in results:
        res_dict = dict(r)
        if res_dict.get('analysis_data'):
            try:
                res_dict['analysis_data'] = json.loads(res_dict['analysis_data'])
            except:
                pass
        job_dict['results'].append(res_dict)
        
    return job_dict

# --- NOTIFICATION UTILS ---

def create_notification(user_id, job_id, message):
    import uuid
    import datetime
    conn = get_db_connection()
    cursor = conn.cursor()
    notif_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow()
    cursor.execute('''
        INSERT INTO notifications (id, user_id, job_id, message, created_at) 
        VALUES (%s, %s, %s, %s, %s)
    ''', (notif_id, user_id, job_id, message, now))
    conn.commit()
    conn.close()
    return notif_id

def get_notifications(user_id, only_unread=False):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = 'SELECT * FROM notifications WHERE user_id = %s'
    params = [user_id]
    if only_unread:
        query += ' AND is_read = 0'
    query += ' ORDER BY created_at DESC LIMIT 50'
    cursor.execute(query, tuple(params))
    notifs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return notifs

def mark_notification_read(notif_id, user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE notifications SET is_read = 1 WHERE id = %s AND user_id = %s', (notif_id, user_id))
    conn.commit()
    conn.close()

def get_unread_count(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM notifications WHERE user_id = %s AND is_read = 0', (user_id,))
    row = cursor.fetchone()
    count = row[0] if row else 0
    conn.close()
    return count

# --- CHAT UTILITIES (PERSISTENCE UPGRADE) ---

def create_chat_session(user_id, title="New Conversation"):
    import uuid
    session_id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO chat_sessions (id, user_id, title)
        VALUES (%s, %s, %s)
    ''', (session_id, user_id, title))
    conn.commit()
    conn.close()
    return session_id

def get_chat_sessions(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('''
        SELECT * FROM chat_sessions 
        WHERE user_id = %s 
        ORDER BY updated_at DESC
    ''', (user_id,))
    sessions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return sessions

def get_chat_session(session_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT * FROM chat_sessions WHERE id = %s', (session_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_chat_title(session_id, title):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE chat_sessions 
        SET title = %s, updated_at = CURRENT_TIMESTAMP 
        WHERE id = %s
    ''', (title, session_id))
    conn.commit()
    conn.close()

def save_chat_message(session_id, role, content):
    """
    ACTIVE CHAT SIGNATURE (PERSISTENCE UPGRADE).
    Overwrites legacy one defined above per Python execution model.
    """
    import uuid
    msg_id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO chat_messages (id, session_id, role, content)
        VALUES (%s, %s, %s, %s)
    ''', (msg_id, session_id, role, content))
    cursor.execute('''
        UPDATE chat_sessions 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = %s
    ''', (session_id,))
    conn.commit()
    conn.close()
    return msg_id

def get_chat_history(session_id):
    """
    ACTIVE CHAT SIGNATURE (PERSISTENCE UPGRADE).
    Overwrites legacy one defined above per Python execution model.
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('''
        SELECT * FROM chat_messages 
        WHERE session_id = %s 
        ORDER BY created_at ASC
    ''', (session_id,))
    messages = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return messages

def delete_chat_session(session_id, user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM chat_messages WHERE session_id = %s', (session_id,))
    cursor.execute('DELETE FROM chat_sessions WHERE id = %s AND user_id = %s', (session_id, user_id))
    conn.commit()
    conn.close()

# === PRODUCTION SAAS AUTH DB UTILITIES ===

def verify_user_email(token_hash):
    """
    Compares current timestamp against expiry, sets is_verified, and nullifies verification tokens.
    """
    import datetime
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    now = datetime.datetime.utcnow()
    
    cursor.execute('''
        SELECT id, email FROM users 
        WHERE verification_token = %s AND verification_token_expires > %s
    ''', (token_hash, now))
    
    user = cursor.fetchone()
    if not user:
        conn.close()
        return None
        
    cursor.execute('''
        UPDATE users 
        SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL 
        WHERE id = %s
    ''', (user['id'],))
    
    conn.commit()
    conn.close()
    return dict(user)

def update_verification_token(email, token_hash, expires_at):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users 
        SET verification_token = %s, verification_token_expires = %s 
        WHERE email = %s AND is_verified = FALSE
    ''', (token_hash, expires_at, email))
    rowcount = cursor.rowcount
    conn.commit()
    conn.close()
    return rowcount > 0

def set_password_reset_token(email, token_hash, expires_at):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users 
        SET reset_token = %s, reset_token_expires = %s 
        WHERE email = %s
    ''', (token_hash, expires_at, email))
    rowcount = cursor.rowcount
    conn.commit()
    conn.close()
    return rowcount > 0

def reset_user_password(token_hash, new_hashed_password):
    import datetime
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    now = datetime.datetime.utcnow()
    
    cursor.execute('''
        SELECT id FROM users 
        WHERE reset_token = %s AND reset_token_expires > %s
    ''', (token_hash, now))
    
    user = cursor.fetchone()
    if not user:
        conn.close()
        return False
        
    cursor.execute('''
        UPDATE users 
        SET password = %s, reset_token = NULL, reset_token_expires = NULL 
        WHERE id = %s
    ''', (new_hashed_password, user['id']))
    
    # Optional security hardening: revoke all user's active refresh tokens on password change!
    cursor.execute('DELETE FROM refresh_tokens WHERE user_id = %s', (user['id'],))
    
    conn.commit()
    conn.close()
    return True

def save_refresh_token(user_id, token_hash, expires_at):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
        VALUES (%s, %s, %s)
    ''', (user_id, token_hash, expires_at))
    conn.commit()
    conn.close()

def validate_and_revoke_refresh_token(old_token_hash, new_token_hash, new_expires_at):
    """
    Performs signature rotation: checks old token validity, 
    deletes it, and creates a fresh one in a single atomic transaction.
    """
    import datetime
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    now = datetime.datetime.utcnow()
    
    try:
        cursor.execute('''
            SELECT user_id FROM refresh_tokens 
            WHERE token_hash = %s AND expires_at > %s
        ''', (old_token_hash, now))
        
        token_row = cursor.fetchone()
        if not token_row:
            conn.close()
            return None
            
        user_id = token_row['user_id']
        
        # Standard Token Rotation (STR): replace old token hash with new one
        cursor.execute('DELETE FROM refresh_tokens WHERE token_hash = %s', (old_token_hash,))
        cursor.execute('''
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
            VALUES (%s, %s, %s)
        ''', (user_id, new_token_hash, new_expires_at))
        
        conn.commit()
        return user_id
    except Exception as e:
        print(f"DB ERR: Token rotation failed: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()

def revoke_refresh_token(token_hash):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM refresh_tokens WHERE token_hash = %s', (token_hash,))
    conn.commit()
    conn.close()

def revoke_all_user_sessions(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM refresh_tokens WHERE user_id = %s', (user_id,))
    conn.commit()
    conn.close()


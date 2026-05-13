import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import db
    print("Import successful.")
    
    print("\nTesting DB connection and init_db()...")
    db.init_db()
    print("SUCCESS: Database and tables initialized.")
    
    print("\nTesting simple create_job()...")
    test_user_id = "diagnostic_test_user"
    
    # First, we need a user to exist to satisfy FOREIGN KEY constraint!
    conn = db.get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO users (id, name, email) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING", (test_user_id, 'Diagnostic User', 'diag@test.com'))
    conn.commit()
    conn.close()
    print("User row confirmed.")
    
    job_id = db.create_job(test_user_id, 'ats', name='diagnostic_test_resume.pdf')
    print(f"SUCCESS: Job created with ID: {job_id}")
    
    print("\nRetrieving job back...")
    job = db.get_job(job_id)
    print(f"SUCCESS: Retrieved Job: {job}")
    
    print("\nDIAGNOSTIC COMPLETED PERFECTLY!")
except Exception as e:
    print("\n!!! DIAGNOSTIC FAILED !!!")
    import traceback
    traceback.print_exc()

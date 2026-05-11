import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import db
import sqlite3

print("Running init_db()...")
db.init_db()
print("Done.")

print("\nChecking schema of table 'jobs':")
conn = sqlite3.connect(db.DB_PATH)
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(jobs)")
columns = cursor.fetchall()
for c in columns:
    print(f"Column: {c[1]}")
conn.close()

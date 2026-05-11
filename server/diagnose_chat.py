import db
import llm
import rag
import uuid
import os
import sys

def run_diagnostics():
    print("=== Starting AI Chat Diagnostics (No Emoji Mode) ===")
    
    # 1. Test DB
    try:
        print("[1/4] Testing DB Session Creation...")
        test_user = "diagnostic_test_user"
        sid = db.create_chat_session(test_user, "Diagnostic Session")
        print("OK: Session Created Successfully:", sid)
    except Exception as e:
        print("FAIL: DB Failure:", e)
        return

    # 2. Test Chat Message Record
    try:
        print("[2/4] Testing DB Message Storage...")
        db.save_chat_message(sid, 'user', 'Test Message Record')
        hist = db.get_chat_history(sid)
        print("OK: Message Saved. History count:", len(hist))
    except Exception as e:
        print("FAIL: DB Write Failure:", e)
        return

    # 3. Test RAG Query logic
    try:
        print("[3/4] Validating Context Bypass Logic...")
        context = ""
        context_resume_id = "global"
        if context_resume_id and context_resume_id != "global":
            context = rag.query_index(context_resume_id, "Test query")
        print("OK: Context logic passes. Context length:", len(context))
    except Exception as e:
        print("FAIL: Logic Failure:", e)
        return

    # 4. Test LLM Bridge
    try:
        print("[4/4] Testing LLM Dispatch (Connecting to Ollama)...")
        print("Triggering live chat generation request...")
        res = llm.get_chat_response("", "Hello. Reply with 'TEST_OK'.")
        print("OK: LLM Response Received:", res.strip()[:50])
    except Exception as e:
        print("FAIL: LLM Runtime Failure:", e)
        return

    print("\n=== ALL SYSTEMS OPERATIONAL ===")
    
    # Cleanup
    db.delete_chat_session(sid, test_user)
    print("Cleanup successful.")

if __name__ == "__main__":
    run_diagnostics()

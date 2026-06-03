import datetime
import hashlib
import secrets
import os
import jwt
import resend
from dotenv import load_dotenv

# Enforce paths
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, '.env')
load_dotenv(dotenv_path)

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "careerforge-super-secret-key-2026")
JWT_ALGORITHM = "HS256"
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Register Resend
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

def generate_access_token(user_data):
    """
    Generates a secure 15-minute JWT Access Token intended to reside in memory only.
    """
    payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'name': user_data.get('name'),
        'role': user_data.get('role', 'candidate'),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_refresh_token():
    """
    Generates an unguessable secure cryptographic string for persistent sessions.
    """
    return secrets.token_hex(64)

def hash_token(token):
    """
    One-way hashes a token string before database persistence. 
    Guarantees token security even in the event of SQL data dumps.
    """
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def send_verification_email(email, raw_token):
    """
    Sends a branded email verification link using Resend API.
    """
    if not RESEND_API_KEY:
        print(f"⚠️ SKIPPED EMAIL DISPATCH: RESEND_API_KEY not found. Token: {raw_token}")
        return False

    verify_link = f"{FRONTEND_URL}/verify-email?token={raw_token}"
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b; font-weight: 800;">Verify your CareerForge account</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Welcome to CareerForge! Please confirm your email address to enable full AI-powered resume analysis.
        </p>
        <div style="margin: 30px 0; text-align: center;">
            <a href="{verify_link}" style="background-color: #0f172a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                Verify My Email
            </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">
            Or paste this URL into your browser:<br/>
            <a href="{verify_link}" style="color: #3b82f6;">{verify_link}</a>
        </p>
    </div>
    """
    
    try:
        params = {
            "from": "CareerForge <onboarding@resend.dev>",
            "to": [email],
            "subject": "🔗 Confirm your CareerForge Email",
            "html": html_content,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"❌ RESEND FAIL: {e}")
        return False

def send_reset_password_email(email, raw_token):
    """
    Sends a password recovery token using Resend API.
    """
    if not RESEND_API_KEY:
        print(f"⚠️ SKIPPED EMAIL DISPATCH: RESEND_API_KEY not found. Reset Token: {raw_token}")
        return False

    reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #dc2626; font-weight: 800;">Reset your CareerForge Password</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            We received a request to reset your account credentials. This secure link will expire in 1 hour.
        </p>
        <div style="margin: 30px 0; text-align: center;">
            <a href="{reset_link}" style="background-color: #ef4444; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                Reset Password Securely
            </a>
        </div>
        <p style="color: #475569; font-size: 14px;">
            If you did not request this, you can safely ignore this email.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">
            Or paste this URL into your browser:<br/>
            <a href="{reset_link}" style="color: #3b82f6;">{reset_link}</a>
        </p>
    </div>
    """
    
    try:
        params = {
            "from": "CareerForge <onboarding@resend.dev>",
            "to": [email],
            "subject": "🔑 CareerForge Password Recovery Link",
            "html": html_content,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"❌ RESEND FAIL: {e}")
        return False

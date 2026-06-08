from celery import Celery
import os
from dotenv import load_dotenv

base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, '.env')
load_dotenv(dotenv_path)

# Phase 3: Scalable Redis-backed Queue
# This replaces the simple threading model with a robust, scalable job system.

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Dynamic SSL/TLS Fix localized for Celery Broker & Backend (requires UPPERCASE CERT_NONE)
CELERY_REDIS_URL = REDIS_URL
if REDIS_URL.startswith('rediss://') and 'ssl_cert_reqs' not in REDIS_URL:
    separator = '&' if '?' in REDIS_URL else '?'
    CELERY_REDIS_URL = f"{REDIS_URL}{separator}ssl_cert_reqs=CERT_NONE"

celery_app = Celery(
    'careerforge',
    broker=CELERY_REDIS_URL,
    backend=CELERY_REDIS_URL,
    include=['tasks']
)

# Optional configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

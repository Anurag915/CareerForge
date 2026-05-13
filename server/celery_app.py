from celery import Celery
import os

# Phase 3: Scalable Redis-backed Queue
# This replaces the simple threading model with a robust, scalable job system.

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Dynamic SSL/TLS Fix for Secure Managed Redis (e.g. Render rediss://)
if REDIS_URL.startswith('rediss://') and 'ssl_cert_reqs' not in REDIS_URL:
    separator = '&' if '?' in REDIS_URL else '?'
    REDIS_URL = f"{REDIS_URL}{separator}ssl_cert_reqs=CERT_NONE"

# Propagate sanitized URL back to system environment to dynamically patch sibling sockets/imports
os.environ['REDIS_URL'] = REDIS_URL

celery_app = Celery(
    'careerforge',
    broker=REDIS_URL,
    backend=REDIS_URL,
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

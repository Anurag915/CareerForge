from celery import Celery
import os

# Phase 3: Scalable Redis-backed Queue
# This replaces the simple threading model with a robust, scalable job system.

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

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

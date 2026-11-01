from celery import Celery
from config import settings

celery_app = Celery(
    'careerforge',
    broker=settings.celery_redis_url,
    backend=settings.celery_redis_url,
    include=['tasks']
)

# Optional configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
    result_expires=3600,
)

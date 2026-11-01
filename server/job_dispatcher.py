"""Queue dispatch policy shared by HTTP endpoints."""

import logging
import threading

from config import settings


logger = logging.getLogger(__name__)


def dispatch_job(job_func, job_id, data, user_id):
    """Send work to Celery, with an explicit development-only local fallback."""
    if settings.redis_url:
        job_func.apply_async(args=[job_id, data, user_id], task_id=job_id)
        return

    if settings.is_production:
        raise RuntimeError("REDIS_URL is required for background jobs in production")

    thread = threading.Thread(
        target=job_func,
        args=(job_id, data, user_id),
        daemon=True,
        name=f"careerforge-job-{job_id}",
    )
    thread.start()
    logger.warning("job_dispatched_to_local_thread job_id=%s", job_id)

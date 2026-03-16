from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "careerly",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Periodic tasks
    beat_schedule={
        "scrape-jobs-hourly": {
            "task": "app.workers.tasks.scrape_new_jobs",
            "schedule": 3600.0,  # Every hour
        },
        "refresh-embeddings-daily": {
            "task": "app.workers.tasks.refresh_job_embeddings",
            "schedule": 86400.0,  # Daily
        },
        "deactivate-expired-jobs": {
            "task": "app.workers.tasks.deactivate_expired_jobs",
            "schedule": 21600.0,  # Every 6 hours
        },
        "refill-monthly-credits": {
            "task": "app.workers.tasks.refill_monthly_credits",
            "schedule": 86400.0,  # Daily check
        },
    },
)

celery_app.autodiscover_tasks(["app.workers"])

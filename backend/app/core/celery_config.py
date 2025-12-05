"""
Celery configuration for background task processing
"""

from celery import Celery
from app.core.config import settings

# Create Celery instance
celery_app = Celery(
    "screenflow_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,  # Process one task at a time for CV parsing
    result_expires=3600,  # Results expire after 1 hour
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.tasks"])

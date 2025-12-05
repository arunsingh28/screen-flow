"""
Background tasks for async processing
"""

from app.tasks.cv_tasks import process_cv_task

__all__ = ["process_cv_task"]

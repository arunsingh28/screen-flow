"""
CV Processing Tasks
Background tasks for parsing CVs with queue management
"""

import asyncio
from typing import Dict, Any
from celery import Task
from sqlalchemy.orm import Session
from app.core.celery_config import celery_app
from app.database import SessionLocal
from app.models.job import CV, CVStatus, CVBatch
from app.services.cv_parser import cv_parser_service
from app.services.s3_service import s3_service
import logging

logger = logging.getLogger(__name__)


class CVProcessingTask(Task):
    """Base task for CV processing with error handling"""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure"""
        cv_id = kwargs.get("cv_id")
        if cv_id:
            db = SessionLocal()
            try:
                cv = db.query(CV).filter(CV.id == cv_id).first()
                if cv:
                    cv.status = CVStatus.FAILED
                    cv.error_message = str(exc)
                    db.commit()

                    # Update batch stats
                    batch = db.query(CVBatch).filter(CVBatch.id == cv.batch_id).first()
                    if batch:
                        batch.failed_cvs += 1
                        db.commit()

                logger.error(f"CV processing failed for {cv_id}: {exc}")
            finally:
                db.close()


@celery_app.task(base=CVProcessingTask, bind=True, name="app.tasks.process_cv")
def process_cv_task(self, cv_id: str, user_id: str) -> Dict[str, Any]:
    """
    Process a single CV in the queue

    Args:
        cv_id: CV UUID
        user_id: User UUID

    Returns:
        Processing result dictionary
    """
    db = SessionLocal()

    try:
        # Get CV from database
        cv = db.query(CV).filter(CV.id == cv_id).first()
        if not cv:
            raise ValueError(f"CV not found: {cv_id}")

        # Update status to processing
        cv.status = CVStatus.PROCESSING
        db.commit()

        # Update task progress (0-100)
        self.update_state(
            state="PROGRESS",
            meta={
                "current": 10,
                "total": 100,
                "status": "Downloading CV from S3...",
                "cv_id": cv_id,
            },
        )

        # Download file from S3
        file_content = s3_service.download_file(cv.s3_key)
        if not file_content:
            raise ValueError(f"Failed to download file from S3: {cv.s3_key}")

        self.update_state(
            state="PROGRESS",
            meta={
                "current": 30,
                "total": 100,
                "status": "Extracting text from CV...",
                "cv_id": cv_id,
            },
        )

        # Parse CV using LLM (async)
        # Use asyncio.run for robust event loop management in sync context
        result = asyncio.run(
            cv_parser_service.parse_cv(cv, file_content, db, user_id)
        )

        self.update_state(
            state="PROGRESS",
            meta={
                "current": 90,
                "total": 100,
                "status": "Finalizing...",
                "cv_id": cv_id,
            },
        )

        if result["success"]:
            # Update CV status
            cv.status = CVStatus.COMPLETED
            db.commit()

            # Update batch stats
            batch = db.query(CVBatch).filter(CVBatch.id == cv.batch_id).first()
            if batch:
                batch.processed_cvs += 1
                db.commit()

            self.update_state(
                state="SUCCESS",
                meta={
                    "current": 100,
                    "total": 100,
                    "status": "Completed successfully",
                    "cv_id": cv_id,
                    "parse_detail_id": result["parse_detail_id"],
                    "usage": result["usage"],
                    "cost": result["cost"],
                },
            )

            return {
                "success": True,
                "cv_id": cv_id,
                "parse_detail_id": result["parse_detail_id"],
                "usage": result["usage"],
                "cost": result["cost"],
            }
        else:
            cv.status = CVStatus.FAILED
            cv.error_message = result.get("error", "Unknown error")
            db.commit()

            # Update batch stats
            batch = db.query(CVBatch).filter(CVBatch.id == cv.batch_id).first()
            if batch:
                batch.failed_cvs += 1
                db.commit()

            raise ValueError(result.get("error", "CV parsing failed"))

    except Exception as e:
        logger.error(f"Error processing CV {cv_id}: {e}")

        # Update CV status
        try:
            cv = db.query(CV).filter(CV.id == cv_id).first()
            if cv:
                cv.status = CVStatus.FAILED
                cv.error_message = str(e)
                db.commit()

                # Update batch stats
                batch = db.query(CVBatch).filter(CVBatch.id == cv.batch_id).first()
                if batch:
                    batch.failed_cvs += 1
                    db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update CV status: {db_error}")

        raise

    finally:
        db.close()


def get_queue_status(batch_id: str) -> Dict[str, Any]:
    """
    Get queue status for a batch

    Args:
        batch_id: Batch UUID

    Returns:
        Queue status dictionary
    """
    db = SessionLocal()

    try:
        batch = db.query(CVBatch).filter(CVBatch.id == batch_id).first()
        if not batch:
            return {"error": "Batch not found"}

        cvs = db.query(CV).filter(CV.batch_id == batch_id).all()

        # Count by status
        queued = sum(1 for cv in cvs if cv.status == CVStatus.QUEUED)
        processing = sum(1 for cv in cvs if cv.status == CVStatus.PROCESSING)
        completed = sum(1 for cv in cvs if cv.status == CVStatus.COMPLETED)
        failed = sum(1 for cv in cvs if cv.status == CVStatus.FAILED)

        total = len(cvs)
        processed_count = completed + failed

        # Calculate percentage and estimated time
        percentage = (processed_count / total * 100) if total > 0 else 0

        # Estimate time remaining (assuming 30 seconds per CV)
        avg_time_per_cv = 30  # seconds
        remaining_cvs = queued + processing
        estimated_time_seconds = remaining_cvs * avg_time_per_cv

        return {
            "batch_id": batch_id,
            "total_cvs": total,
            "queued": queued,
            "processing": processing,
            "completed": completed,
            "failed": failed,
            "percentage": round(percentage, 2),
            "estimated_time_seconds": estimated_time_seconds,
            "estimated_time_minutes": round(estimated_time_seconds / 60, 1),
        }

    finally:
        db.close()

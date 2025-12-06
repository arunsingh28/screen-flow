"""
CV Processing Tasks
Background tasks for parsing CVs with queue management
Independent processing that fetches JD from batch for scalability
"""

import asyncio
import time
from typing import Dict, Any, Optional
from celery import Task
from sqlalchemy.orm import Session
from app.core.celery_config import celery_app
from app.core.redis_events import redis_event_bus
from app.database import SessionLocal
from app.models.job import CV, CVStatus, CVBatch
from app.models.jd_builder import JobDescription
from app.services.cv_parser import cv_parser_service
from app.services.cv_jd_matcher import cv_jd_matcher_service
from app.services.s3_service import s3_service
import logging

logger = logging.getLogger(__name__)

# Processing stages with progress percentages
PROCESSING_STAGES = {
    "QUEUED": (0, "Waiting in queue..."),
    "DOWNLOADING": (10, "Downloading CV from storage..."),
    "EXTRACTING": (20, "Extracting text from document..."),
    "ANALYZING_STRUCTURE": (30, "Analyzing CV structure..."),
    "PARSING_WITH_AI": (50, "Parsing CV with AI..."),
    "MATCHING_JD": (70, "Matching against job requirements..."),
    "ANALYZING_GITHUB": (80, "Analyzing GitHub profile..."),
    "FINALIZING": (90, "Finalizing results..."),
    "COMPLETED": (100, "Processing completed"),
}


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


def _publish_progress(
    user_id: str,
    cv_id: str,
    batch_id: str,
    stage_key: str,
    filename: str = None,
    **kwargs
):
    """Helper to publish progress events"""
    progress, status = PROCESSING_STAGES[stage_key]
    redis_event_bus.publish_cv_progress(
        user_id=user_id,
        cv_id=cv_id,
        batch_id=batch_id,
        progress=progress,
        status=status,
        stage=stage_key,
        filename=filename,
        **kwargs
    )


@celery_app.task(base=CVProcessingTask, bind=True, name="app.tasks.process_cv")
def process_cv_task(self, cv_id: str, user_id: str) -> Dict[str, Any]:
    """
    Process a single CV in the queue with detailed progress tracking

    Architecture:
    - Independent processing: Fetches JD from the batch's account
    - Scalable: Can process CVs from multiple accounts in parallel
    - Progress tracking: 9 detailed stages with real-time updates
    - Smart matching: Compares CV against JD when available

    Args:
        cv_id: CV UUID
        user_id: User UUID

    Returns:
        Processing result dictionary
    """
    db = SessionLocal()
    start_time = time.time()
    total_usage = {"input_tokens": 0, "output_tokens": 0}
    total_cost = 0.0

    try:
        # Get CV from database
        cv = db.query(CV).filter(CV.id == cv_id).first()
        if not cv:
            raise ValueError(f"CV not found: {cv_id}")

        # Get batch to fetch associated JD
        batch = db.query(CVBatch).filter(CVBatch.id == cv.batch_id).first()
        if not batch:
            raise ValueError(f"Batch not found: {cv.batch_id}")

        # Fetch Job Description from batch (independent of account)
        job_description: Optional[JobDescription] = None
        if batch.job_description_id:
            job_description = db.query(JobDescription).filter(
                JobDescription.id == batch.job_description_id
            ).first()
            logger.info(f"Fetched JD {batch.job_description_id} for CV {cv_id}")

        # Update status to processing
        cv.status = CVStatus.PROCESSING
        db.commit()

        # Stage 1: Downloading (10%)
        _publish_progress(user_id, cv_id, str(cv.batch_id), "DOWNLOADING", cv.filename)
        self.update_state(state="PROGRESS", meta={"progress": 10, "stage": "DOWNLOADING"})

        file_content = s3_service.download_file(cv.s3_key)
        if not file_content:
            raise ValueError(f"Failed to download file from S3: {cv.s3_key}")

        # Stage 2: Extracting text (20%)
        _publish_progress(user_id, cv_id, str(cv.batch_id), "EXTRACTING", cv.filename)
        self.update_state(state="PROGRESS", meta={"progress": 20, "stage": "EXTRACTING"})

        # Brief pause to show stage transition
        time.sleep(0.5)

        # Stage 3: Analyzing structure (30%)
        _publish_progress(user_id, cv_id, str(cv.batch_id), "ANALYZING_STRUCTURE", cv.filename)
        self.update_state(state="PROGRESS", meta={"progress": 30, "stage": "ANALYZING_STRUCTURE"})

        # Stage 4: Parsing with AI (50%)
        _publish_progress(user_id, cv_id, str(cv.batch_id), "PARSING_WITH_AI", cv.filename)
        self.update_state(state="PROGRESS", meta={"progress": 50, "stage": "PARSING_WITH_AI"})

        # Parse CV using LLM (async)
        result = asyncio.run(
            cv_parser_service.parse_cv(cv, file_content, db, user_id)
        )

        if not result["success"]:
            raise ValueError(result.get("error", "CV parsing failed"))

        # Track usage and cost
        total_usage["input_tokens"] += result["usage"].get("input_tokens", 0)
        total_usage["output_tokens"] += result["usage"].get("output_tokens", 0)
        total_cost += result["cost"]

        parsed_data = result["parsed_data"]

        # Stage 5: Matching against JD (70%) - Only if JD exists
        if job_description:
            _publish_progress(
                user_id, cv_id, str(cv.batch_id), "MATCHING_JD", cv.filename,
                jd_title=job_description.job_title
            )
            self.update_state(state="PROGRESS", meta={"progress": 70, "stage": "MATCHING_JD"})

            # Perform CV-JD matching
            match_result = asyncio.run(
                cv_jd_matcher_service.match_cv_to_jd(
                    cv_parsed_data=parsed_data,
                    job_description=job_description,
                    db=db,
                    user_id=user_id,
                    cv_id=cv_id,
                )
            )

            if match_result["success"]:
                # Save match score and data
                cv.jd_match_score = match_result["match_score"]
                cv.jd_match_data = match_result["match_data"]
                db.commit()

                # Track usage
                total_usage["input_tokens"] += match_result["usage"].get("input_tokens", 0)
                total_usage["output_tokens"] += match_result["usage"].get("output_tokens", 0)
                total_cost += match_result["cost"]

                logger.info(f"CV {cv_id} matched with score: {match_result['match_score']}%")
            else:
                logger.warning(f"JD matching failed for CV {cv_id}: {match_result.get('error')}")

        # Stage 6: Analyzing GitHub (80%) - Optional, skip for now
        # Can be implemented later if github_username is found
        github_username = parsed_data.get("personal_info", {}).get("github", "").split("/")[-1] if parsed_data.get("personal_info", {}).get("github") else None
        if github_username:
            _publish_progress(
                user_id, cv_id, str(cv.batch_id), "ANALYZING_GITHUB", cv.filename,
                github_username=github_username
            )
            self.update_state(state="PROGRESS", meta={"progress": 80, "stage": "ANALYZING_GITHUB"})
            time.sleep(0.5)  # Placeholder for future GitHub analysis

        # Stage 7: Finalizing (90%)
        _publish_progress(user_id, cv_id, str(cv.batch_id), "FINALIZING", cv.filename)
        self.update_state(state="PROGRESS", meta={"progress": 90, "stage": "FINALIZING"})

        # Update CV status
        cv.status = CVStatus.COMPLETED
        cv.processed_at = db.query(db.func.now()).scalar()
        db.commit()

        # Update batch stats
        batch.processed_cvs += 1
        db.commit()

        # Calculate processing time
        processing_time = time.time() - start_time

        # Stage 8: Completed (100%)
        _publish_progress(
            user_id, cv_id, str(cv.batch_id), "COMPLETED", cv.filename,
            parse_detail_id=result["parse_detail_id"],
            match_score=cv.jd_match_score,
            processing_time=round(processing_time, 2)
        )

        # Publish batch progress update
        queue_status = get_queue_status(str(cv.batch_id))
        redis_event_bus.publish_batch_progress(
            user_id=user_id,
            batch_id=str(cv.batch_id),
            queue_status=queue_status,
        )

        self.update_state(
            state="SUCCESS",
            meta={
                "progress": 100,
                "stage": "COMPLETED",
                "cv_id": cv_id,
                "parse_detail_id": result["parse_detail_id"],
                "match_score": cv.jd_match_score,
                "usage": total_usage,
                "cost": total_cost,
                "processing_time": processing_time,
            },
        )

        return {
            "success": True,
            "cv_id": cv_id,
            "parse_detail_id": result["parse_detail_id"],
            "match_score": cv.jd_match_score,
            "usage": total_usage,
            "cost": total_cost,
            "processing_time": processing_time,
        }

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

                # Publish error event
                redis_event_bus.publish_cv_progress(
                    user_id=user_id,
                    cv_id=cv_id,
                    batch_id=str(cv.batch_id),
                    progress=0,
                    status=f"Failed: {str(e)}",
                    stage="FAILED",
                    error=str(e),
                )
        except Exception as db_error:
            logger.error(f"Failed to update CV status: {db_error}")

        raise

    finally:
        db.close()


def get_queue_status(batch_id: str) -> Dict[str, Any]:
    """
    Get queue status for a batch with dynamic time estimation

    Args:
        batch_id: Batch UUID

    Returns:
        Queue status dictionary with real-time estimates
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

        # Calculate percentage
        percentage = (processed_count / total * 100) if total > 0 else 0

        # Calculate dynamic average processing time from completed CVs
        completed_cvs = [cv for cv in cvs if cv.status == CVStatus.COMPLETED and cv.processed_at and cv.created_at]

        if len(completed_cvs) >= 2:
            # Use actual average processing time from completed CVs
            total_time = sum(
                (cv.processed_at - cv.created_at).total_seconds()
                for cv in completed_cvs
            )
            avg_time_per_cv = total_time / len(completed_cvs)
        else:
            # Default estimate: 40 seconds per CV (includes JD matching)
            avg_time_per_cv = 40

        # Estimate time remaining
        remaining_cvs = queued + processing
        estimated_time_seconds = remaining_cvs * avg_time_per_cv

        # Build queue details for each CV
        queue_details = []
        position = 1
        for cv in sorted(cvs, key=lambda x: x.created_at):
            if cv.status == CVStatus.QUEUED:
                queue_details.append({
                    "cv_id": str(cv.id),
                    "filename": cv.filename,
                    "queue_position": position,
                    "estimated_wait_seconds": position * avg_time_per_cv,
                })
                position += 1

        return {
            "batch_id": batch_id,
            "total_cvs": total,
            "queued": queued,
            "processing": processing,
            "completed": completed,
            "failed": failed,
            "percentage": round(percentage, 2),
            "avg_processing_time_seconds": round(avg_time_per_cv, 1),
            "estimated_time_seconds": round(estimated_time_seconds),
            "estimated_time_minutes": round(estimated_time_seconds / 60, 1),
            "queue_details": queue_details[:10],  # Return first 10 for display
        }

    finally:
        db.close()

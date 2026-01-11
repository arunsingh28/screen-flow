"""
CV Processing API endpoints with queue support
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import traceback
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.job import CV, CVBatch, CVStatus
from app.models.jd_builder import JobDescription, CVParseDetail
from app.schemas.cv_schemas import CVParseDetailResponse, QueueStatusResponse, CVProcessResponse
from app.tasks.cv_tasks import process_cv_task, get_queue_status
from app.core.websocket import manager
from sqlalchemy import desc
import logging
import asyncio
import json

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/batch/{batch_id}/process", response_model=CVProcessResponse)
async def process_batch_cvs(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Start processing all CVs in a batch with queue
    """
    try:
        # Get batch
        batch = db.query(CVBatch).filter(
            CVBatch.id == batch_id,
            CVBatch.user_id == current_user.id,
        ).first()

        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")

        # Get all queued CVs
        cvs = db.query(CV).filter(
            CV.batch_id == batch_id,
            CV.status == CVStatus.QUEUED,
        ).all()

        if not cvs:
            return CVProcessResponse(
                success=False,
                message="No CVs to process",
                batch_id=batch_id,
                total_cvs=0,
                task_ids=[],
            )

        # Queue all CVs for processing
        task_ids = []
        for cv in cvs:
            task = process_cv_task.delay(cv_id=str(cv.id), user_id=str(current_user.id))
            task_ids.append(task.id)

        logger.info(f"Queued {len(cvs)} CVs for processing in batch {batch_id}")

        # Send WebSocket update
        await manager.send_batch_progress(
            user_id=str(current_user.id),
            batch_id=batch_id,
            queue_status=get_queue_status(batch_id),
        )

        return CVProcessResponse(
            success=True,
            message=f"Queued {len(cvs)} CVs for processing",
            batch_id=batch_id,
            total_cvs=len(cvs),
            task_ids=task_ids,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/batch/{batch_id}/queue-status", response_model=QueueStatusResponse)
async def get_batch_queue_status(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get queue status for a batch
    """
    try:
        # Verify batch belongs to user
        batch = db.query(CVBatch).filter(
            CVBatch.id == batch_id,
            CVBatch.user_id == current_user.id,
        ).first()

        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")

        queue_status = get_queue_status(batch_id)

        if "error" in queue_status:
            raise HTTPException(status_code=404, detail=queue_status["error"])

        return QueueStatusResponse(**queue_status)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting queue status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cv/{cv_id}/parse-details", response_model=CVParseDetailResponse)
async def get_cv_parse_details(
    cv_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get parsed CV details
    """
    try:
        # Get CV
        cv = db.query(CV).filter(
            CV.id == cv_id,
            CV.user_id == current_user.id,
        ).first()

        if not cv:
            raise HTTPException(status_code=404, detail="CV not found")

        # Get parse details
        if not cv.parse_detail:
            raise HTTPException(status_code=404, detail="CV not yet parsed")

        parse_detail = cv.parse_detail

        return CVParseDetailResponse(
            id=str(parse_detail.id),
            cv_id=str(parse_detail.cv_id),
            candidate_name=parse_detail.candidate_name,
            candidate_email=parse_detail.candidate_email,
            current_role=parse_detail.current_role,
            current_company=parse_detail.current_company,
            total_experience_years=parse_detail.total_experience_years,
            career_level=parse_detail.career_level,
            current_skills_count=parse_detail.current_skills_count,
            outdated_skills_count=parse_detail.outdated_skills_count,
            github_username=parse_detail.github_username,
            cv_quality_score=parse_detail.cv_quality_score,
            parsing_confidence=parse_detail.parsing_confidence,
            red_flags_count=parse_detail.red_flags_count,
            parsed_data=parse_detail.parsed_data,
            created_at=parse_detail.created_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting parse details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/batch/{batch_id}/parsed-cvs")
async def get_batch_parsed_cvs(
    batch_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all parsed CVs in a batch
    """
    try:
        # Verify batch belongs to user
        batch = db.query(CVBatch).filter(
            CVBatch.id == batch_id,
            CVBatch.user_id == current_user.id,
        ).first()

        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")

        # Get parsed CVs
        cvs = (
            db.query(CV)
            .filter(CV.batch_id == batch_id, CV.status == CVStatus.COMPLETED)
            .order_by(desc(CV.processed_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

        results = []
        for cv in cvs:
            if cv.parse_detail:
                results.append({
                    "cv_id": str(cv.id),
                    "filename": cv.filename,
                    "candidate_name": cv.parse_detail.candidate_name,
                    "candidate_email": cv.parse_detail.candidate_email,
                    "current_role": cv.parse_detail.current_role,
                    "current_company": cv.parse_detail.current_company,
                    "total_experience_years": cv.parse_detail.total_experience_years,
                    "career_level": cv.parse_detail.career_level,
                    "cv_quality_score": cv.parse_detail.cv_quality_score,
                    "red_flags_count": cv.parse_detail.red_flags_count,
                    "processed_at": cv.processed_at,
                })

        return {
            "batch_id": batch_id,
            "total_parsed": len(results),
            "cvs": results,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting parsed CVs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cv/{cv_id}/retry", response_model=CVProcessResponse)
async def retry_cv_processing(
    cv_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retry processing a failed CV
    """
    try:
        # Get CV
        cv = db.query(CV).filter(
            CV.id == cv_id,
            CV.user_id == current_user.id,
        ).first()

        if not cv:
            raise HTTPException(status_code=404, detail="CV not found")

        # Reset status
        cv.status = CVStatus.QUEUED
        cv.error_message = None
        db.commit()

        # Trigger task
        task = process_cv_task.delay(cv_id=str(cv.id), user_id=str(current_user.id))

        # Send WebSocket update
        from app.core.redis_events import redis_event_bus
        redis_event_bus.publish_cv_progress(
            user_id=str(current_user.id),
            cv_id=str(cv.id),
            batch_id=str(cv.batch_id),
            progress=0,
            status="Queued for retry",
        )

        return CVProcessResponse(
            success=True,
            message="CV queued for retry",
            batch_id=str(cv.batch_id),
            total_cvs=1,
            task_ids=[task.id],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrying CV: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cv/{cv_id}/match", response_model=CVProcessResponse)
async def match_existing_parsed_cv(
    cv_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run JD matching for an already-parsed CV using the batch's linked Job Description.

    This bypasses re-parsing and is useful to (re)generate scoring when JD linkage was added later.
    """
    try:
        # Fetch CV and ensure ownership
        cv = db.query(CV).filter(
            CV.id == cv_id,
            CV.user_id == current_user.id,
        ).first()

        if not cv:
            raise HTTPException(status_code=404, detail="CV not found")

        # Fetch batch and linked Job Description
        batch = db.query(CVBatch).filter(CVBatch.id == cv.batch_id).first()
        if not batch or not batch.job_description_id:
            raise HTTPException(status_code=400, detail="Job Description not linked to this batch")

        job_description = db.query(JobDescription).filter(JobDescription.id == batch.job_description_id).first()
        if not job_description:
            raise HTTPException(status_code=404, detail="Linked Job Description not found")

        # Get parsed CV data
        parse_detail = db.query(CVParseDetail).filter(CVParseDetail.cv_id == cv.id).first()
        if not parse_detail or not parse_detail.parsed_data:
            raise HTTPException(status_code=400, detail="Parsed CV data not found for this CV")

        # Perform matching using existing parsed data
        from app.services.cv_jd_matcher import cv_jd_matcher_service

        match_result = await cv_jd_matcher_service.match_cv_to_jd(
            cv_parsed_data=parse_detail.parsed_data,
            job_description=job_description,
            db=db,
            user_id=str(current_user.id),
            cv_id=cv_id,
        )

        if not match_result.get("success"):
            raise HTTPException(status_code=500, detail=f"Matching failed: {match_result.get('error')}")

        # Persist score and match data on CV
        cv.jd_match_score = match_result.get("match_score")
        cv.jd_match_data = match_result.get("match_data")
        db.commit()

        return CVProcessResponse(
            success=True,
            message="CV matched successfully",
            batch_id=str(cv.batch_id),
            total_cvs=1,
            task_ids=[],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error matching CV: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{user_id}")
async def cv_processing_websocket(
    websocket: WebSocket,
    user_id: str
):
    """
    WebSocket endpoint for real-time CV processing updates
    Forwards events from Redis (published by Celery) to WebSocket clients
    """
    import asyncio
    import json as json_lib
    from app.core.config import settings

    await manager.connect(websocket, user_id)
    logger.info(f"WebSocket connected for user {user_id}")

    # Create Redis subscription for this user
    async def listen_redis_events():
        """Listen to Redis pub/sub and forward events to WebSocket"""
        try:
            import redis.asyncio as aioredis

            # Create async Redis client
            redis = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            pubsub = redis.pubsub()

            # Subscribe to user-specific channel
            channel = f"user:{user_id}:events"
            await pubsub.subscribe(channel)
            logger.info(f"Subscribed to Redis channel: {channel}")

            # Listen for messages
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        event = json_lib.loads(message["data"])
                        await websocket.send_json(event)
                        logger.debug(f"Forwarded {event.get('type')} event to WebSocket")
                    except Exception as e:
                        logger.error(f"Error forwarding event: {e}")
                        break

        except Exception as e:
            logger.error(f"Redis subscription error: {e}")
        finally:
            try:
                await pubsub.unsubscribe(channel)
                await redis.close()
            except:
                pass

    # Start Redis listener task
    redis_task = asyncio.create_task(listen_redis_events())

    try:
        # Keep connection alive and handle client messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)

                # Handle ping/pong
                if data == "ping":
                    await websocket.send_json({"type": "pong"})

            except asyncio.TimeoutError:
                # Send periodic heartbeat
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except:
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        # Cleanup
        redis_task.cancel()
        try:
            await redis_task
        except asyncio.CancelledError:
            pass
        manager.disconnect(websocket, user_id)

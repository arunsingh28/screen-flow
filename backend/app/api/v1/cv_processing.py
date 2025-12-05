"""
CV Processing API endpoints with queue support
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.job import CV, CVBatch, CVStatus
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


@router.websocket("/ws/{user_id}")
async def cv_processing_websocket(
    websocket: WebSocket, 
    user_id: str,
    token: str = None
):
    """
    WebSocket endpoint for real-time CV processing updates
    """
    if not token:
        await websocket.close(code=1008)
        return

    try:
        from jose import jwt, JWTError
        from app.core.config import settings
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        token_user_id = payload.get("sub")
        if token_user_id is None or token_user_id != user_id:
            logger.warning(f"WebSocket auth failed: User mismatch {token_user_id} != {user_id}")
            await websocket.close(code=1008)
            return
    except JWTError:
        logger.warning("WebSocket auth failed: Invalid token")
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, user_id)
    
    redis_conn = None
    pubsub = None
    
    try:
        import redis.asyncio as redis
        from app.core.config import settings
        
        # Connect to Redis
        redis_conn = redis.from_url(settings.REDIS_URL, decode_responses=True)
        pubsub = redis_conn.pubsub()
        channel = f"user:{user_id}:events"
        
        # Subscribe to user's event channel
        await pubsub.subscribe(channel)
        
        # Create a task to listen for Redis messages
        async def listen_to_redis():
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        event_data = json.loads(message["data"])
                        await websocket.send_json(event_data)
                    except Exception as e:
                        logger.error(f"Error forwarding Redis event: {e}")

        # Run listener in background
        redis_task = asyncio.create_task(listen_to_redis())
        
        # Keep connection open and handle client disconnects
        # We also need to wait for the client to close or task to fail
        try:
            while True:
                # Wait for any message from client (ping/pong) to keep alive
                # or just wait indefinitely if one-way
                data = await websocket.receive_text()
                # Optional: handle client messages
        except WebSocketDisconnect:
            pass
        finally:
            redis_task.cancel()
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if pubsub:
            await pubsub.unsubscribe()
        if redis_conn:
            await redis_conn.close()
        manager.disconnect(websocket, user_id)

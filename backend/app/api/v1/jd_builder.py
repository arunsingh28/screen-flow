"""
JD Builder API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.jd_builder import JobDescription, JDSource, JDStatus, LLMCall
from app.schemas.jd_schemas import (
    JDBuilderInput,
    JDUploadInput,
    JDRefinementInput,
    JDResponse,
    LLMCallResponse,
    LLMStatsResponse,
)
from app.services.jd_builder import jd_builder_service
from app.core.websocket import manager
from sqlalchemy import func, desc
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/build", response_model=JDResponse)
async def build_jd(
    jd_input: JDBuilderInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Build a JD from form inputs
    """
    try:
        # Create JD record
        jd = JobDescription(
            user_id=current_user.id,
            job_title=jd_input.job_title,
            department=jd_input.department,
            employment_type=jd_input.employment_type,
            location=jd_input.location,
            seniority_level=jd_input.seniority_level,
            min_years_experience=jd_input.min_years_experience,
            max_years_experience=jd_input.max_years_experience,
            company_type=jd_input.company_type,
            industry=jd_input.industry,
            prior_roles=jd_input.prior_roles,
            source=JDSource.BUILDER,
            status=JDStatus.DRAFT,
        )
        db.add(jd)
        db.commit()
        db.refresh(jd)

        # Send WebSocket update
        await manager.send_jd_generation_progress(
            user_id=str(current_user.id),
            jd_id=str(jd.id),
            progress=10,
            status="Preparing to generate JD...",
        )

        # Generate JD
        result = await jd_builder_service.generate_jd(
            jd=jd, db=db, user_id=str(current_user.id)
        )

        # Send completion update
        if result["success"]:
            await manager.send_jd_generation_progress(
                user_id=str(current_user.id),
                jd_id=str(jd.id),
                progress=100,
                status="JD generated successfully!",
            )

        return JDResponse(**result)

    except Exception as e:
        logger.error(f"Error building JD: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload", response_model=JDResponse)
async def upload_jd(
    jd_upload: JDUploadInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload and parse an existing JD
    """
    try:
        # Parse uploaded JD
        result = await jd_builder_service.parse_uploaded_jd(
            jd_text=jd_upload.jd_text, db=db, user_id=str(current_user.id)
        )

        if not result["success"]:
            return JDResponse(success=False, error=result.get("error"))

        parsed_jd = result["parsed_jd"]
        extraction_status = result["extraction_status"]
        missing_fields = result.get("missing_fields", [])

        # Create JD record
        extracted_data = parsed_jd.get("extracted_data", {})

        jd = JobDescription(
            user_id=current_user.id,
            job_title=extracted_data.get("job_title", "Unknown"),
            department=extracted_data.get("department"),
            employment_type=extracted_data.get("employment_type"),
            location=extracted_data.get("location"),
            seniority_level=extracted_data.get("seniority_level"),
            min_years_experience=extracted_data.get("years_of_experience", {}).get("min"),
            max_years_experience=extracted_data.get("years_of_experience", {}).get("max"),
            company_type=extracted_data.get("company_type"),
            industry=extracted_data.get("industry"),
            prior_roles=",".join(extracted_data.get("prior_roles", [])) if extracted_data.get("prior_roles") else None,
            source=JDSource.UPLOAD,
            original_jd_text=jd_upload.jd_text,
            structured_jd=parsed_jd,
            missing_fields=missing_fields if missing_fields else None,
            status=JDStatus.COMPLETED if extraction_status == "complete" else JDStatus.DRAFT,
        )
        db.add(jd)
        db.commit()
        db.refresh(jd)

        return JDResponse(
            success=True,
            jd_id=str(jd.id),
            structured_jd=parsed_jd,
            extraction_status=extraction_status,
            missing_fields=missing_fields,
            usage=result.get("usage"),
            cost=result.get("cost"),
        )

    except Exception as e:
        logger.error(f"Error uploading JD: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refine", response_model=JDResponse)
async def refine_jd(
    refinement_input: JDRefinementInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Refine JD with user-provided missing fields
    """
    try:
        # Get JD
        jd = db.query(JobDescription).filter(
            JobDescription.id == refinement_input.jd_id,
            JobDescription.user_id == current_user.id,
        ).first()

        if not jd:
            raise HTTPException(status_code=404, detail="JD not found")

        # Refine JD
        result = await jd_builder_service.refine_jd(
            jd=jd,
            user_provided_fields=refinement_input.provided_fields,
            db=db,
            user_id=str(current_user.id),
        )

        return JDResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refining JD: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_jds(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List user's JDs
    """
    jds = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id, JobDescription.is_active == True)
        .order_by(desc(JobDescription.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "jds": [
            {
                "id": str(jd.id),
                "job_title": jd.job_title,
                "department": jd.department,
                "location": jd.location,
                "seniority_level": jd.seniority_level,
                "source": jd.source.value,
                "status": jd.status.value,
                "created_at": jd.created_at,
            }
            for jd in jds
        ]
    }


@router.get("/{jd_id}")
async def get_jd(
    jd_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get JD details
    """
    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == current_user.id,
    ).first()

    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")

    return {
        "id": str(jd.id),
        "job_title": jd.job_title,
        "department": jd.department,
        "employment_type": jd.employment_type,
        "location": jd.location,
        "seniority_level": jd.seniority_level,
        "min_years_experience": jd.min_years_experience,
        "max_years_experience": jd.max_years_experience,
        "company_type": jd.company_type,
        "industry": jd.industry,
        "prior_roles": jd.prior_roles,
        "source": jd.source.value,
        "status": jd.status.value,
        "structured_jd": jd.structured_jd,
        "missing_fields": jd.missing_fields,
        "created_at": jd.created_at,
    }


@router.get("/llm/stats", response_model=LLMStatsResponse)
async def get_llm_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get LLM usage statistics for current user
    """
    # Get all LLM calls for user
    llm_calls = db.query(LLMCall).filter(LLMCall.user_id == current_user.id).all()

    # Calculate totals
    total_calls = len(llm_calls)
    total_tokens = sum(call.total_tokens for call in llm_calls)
    total_cost = sum(call.total_cost for call in llm_calls)

    # Group by call type
    by_call_type = {}
    for call_type in ["jd_generation", "jd_parsing", "cv_parsing", "cv_matching", "github_analysis"]:
        type_calls = [call for call in llm_calls if call.call_type.value == call_type]
        by_call_type[call_type] = {
            "count": len(type_calls),
            "total_tokens": sum(call.total_tokens for call in type_calls),
            "total_cost": sum(call.total_cost for call in type_calls),
        }

    # Get recent calls
    recent_calls = (
        db.query(LLMCall)
        .filter(LLMCall.user_id == current_user.id)
        .order_by(desc(LLMCall.created_at))
        .limit(10)
        .all()
    )

    recent_calls_response = [
        LLMCallResponse(
            id=str(call.id),
            call_type=call.call_type.value,
            model_name=call.model_name,
            input_tokens=call.input_tokens,
            output_tokens=call.output_tokens,
            total_tokens=call.total_tokens,
            input_cost=call.input_cost,
            output_cost=call.output_cost,
            total_cost=call.total_cost,
            latency_ms=call.latency_ms,
            created_at=call.created_at,
        )
        for call in recent_calls
    ]

    return LLMStatsResponse(
        total_calls=total_calls,
        total_tokens=total_tokens,
        total_cost=total_cost,
        by_call_type=by_call_type,
        recent_calls=recent_calls_response,
    )


@router.websocket("/ws/{user_id}")
async def jd_websocket(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time JD generation updates
    """
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

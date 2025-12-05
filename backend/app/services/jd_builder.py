"""
JD Builder Service
Handles JD generation and parsing with LLM
Optimized with TOON encoding for 30-60% token savings
"""

import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.llm_factory import llm_factory
from app.services.toon_service import toon_service
from app.models.jd_builder import LLMCallType, JobDescription, JDStatus, JDSource
import logging

logger = logging.getLogger(__name__)


JD_GENERATION_PROMPT = """You are an expert recruiter with deep knowledge of 2025 job market trends across all industries, geographies, and company types.

Generate a realistic, comprehensive job description based on these specific details:

INPUT CONTEXT:
- Job Title: {job_title}
- Department: {department}
- Employment Type: {employment_type}
- Location: {location}
- Seniority Level: {seniority_level}
- Years of Experience: {min_years}-{max_years} years
- Company Type: {company_type}
- Industry/Domain: {industry}
- Prior Role Titles: {prior_roles}

CRITICAL REQUIREMENTS:
1. ALL suggestions must be realistic for THIS specific combination of inputs
2. Adjust expectations based on seniority (Entry vs Senior = completely different)
3. Adjust based on company type (Startup vs MNC = different pace, tools, compensation)
4. Adjust based on location (Bangalore vs Mumbai vs Remote = different salary, culture)
5. Adjust based on department (Engineering vs Sales = completely different skills)
6. If something doesn't apply, return empty array
7. Use ACTUAL tools, REALISTIC salaries, REAL team structures
8. Confidence scores = how universal this requirement is for THIS exact role

Return ONLY this JSON:

{{
  "must_have_skills": [
    {{
      "skill": "specific skill name",
      "proficiency": "beginner/intermediate/advanced/expert",
      "confidence": 0-100,
      "priority": "high/medium",
      "reasoning": "why this skill matters for this exact role"
    }}
  ],

  "nice_to_have_skills": [
    {{
      "skill": "skill name",
      "confidence": 0-100,
      "why_bonus": "specific value-add for this role context"
    }}
  ],

  "key_responsibilities": [
    {{
      "responsibility": "specific, actionable responsibility appropriate for seniority",
      "priority": 1-5,
      "time_allocation": "realistic % for this seniority"
    }}
  ],

  "education": {{
    "requirement_level": "required/preferred/not_required",
    "degree_level": "bachelor/master/phd/certification/diploma/any",
    "field_of_study": ["relevant fields for department"],
    "can_substitute_with_experience": true/false,
    "reasoning": "why this education level makes sense"
  }},

  "additional_context": {{
    "industry": "inferred or provided industry",
    "domain_expertise": ["specific domains relevant to industry + department"],
    "team_size": "realistic for seniority at company type",
    "reporting_to": "realistic reporting structure",
    "collaboration": ["actual teams in company type department context"],
    "tools": ["ACTUAL tools used in department at company type, not generic"],
    "certifications": ["only real certifications that exist for this role, empty if none"],
    "work_environment": "remote/hybrid/onsite based on location and company type norms"
  }},

  "compensation": {{
    "salary_range_inr": {{
      "min": realistic_min,
      "max": realistic_max,
      "confidence": "high/medium/low",
      "note": "based on location, seniority, company type, department"
    }},
    "equity_rsu": "applicable for company type? typical range if yes",
    "notice_period_expectation": "15/30/60/90 days based on seniority and employment type",
    "other_benefits": ["realistic for company type and employment type"]
  }},

  "meta": {{
    "role_type": "technical/non-technical/creative/sales/operations/leadership",
    "demand_level": "high/medium/low in current 2025 market",
    "confidence_in_suggestions": "high/medium/low",
    "reasoning_summary": "2-3 sentences explaining key assumptions and context used"
  }}
}}"""


JD_PARSING_PROMPT = """You are an expert recruiter analyzing job descriptions. Extract structured information from the provided JD text.

JOB DESCRIPTION TEXT:
{jd_text}

YOUR TASK:
1. Extract all available information accurately
2. Infer missing details ONLY if there's strong evidence in the text
3. If critical information is missing, identify what's needed
4. Generate same structured output as the JD builder

EXTRACTION RULES:
- Be conservative - don't hallucinate details not in the text
- If salary not mentioned, don't guess - mark as missing
- Infer seniority from: job title, years required, responsibilities complexity
- Infer company type from: culture descriptions, benefits, scale mentions
- Extract skills from: requirements section, qualifications, nice-to-have
- Distinguish must-have vs nice-to-have based on language ("required" vs "preferred")

Return ONLY this JSON:

{{
  "extraction_status": "complete/partial/missing_critical",

  "missing_fields": [
    {{
      "field": "field_name",
      "criticality": "critical/important/optional",
      "question_to_ask_user": "What is the [specific question]?",
      "why_needed": "brief explanation of why this matters for matching"
    }}
  ],

  "extracted_data": {{
    "job_title": "extracted or null",
    "department": "extracted/inferred or null",
    "employment_type": "extracted or null",
    "location": "extracted or null",
    "seniority_level": "inferred from title/years/responsibilities or null",
    "years_of_experience": {{
      "min": number or null,
      "max": number or null,
      "confidence": "high/medium/low"
    }},
    "company_type": "inferred from context or null",
    "industry": "extracted/inferred or null",
    "prior_roles": ["extracted if mentioned"] or null
  }},

  "must_have_skills": [
    {{
      "skill": "extracted skill",
      "proficiency": "inferred from context",
      "confidence": 0-100,
      "priority": "high/medium",
      "source_text": "quote from JD that mentions this"
    }}
  ],

  "nice_to_have_skills": [
    {{
      "skill": "extracted skill",
      "confidence": 0-100,
      "source_text": "quote from JD"
    }}
  ],

  "key_responsibilities": [
    {{
      "responsibility": "extracted from JD",
      "priority": "inferred 1-5 based on order/emphasis",
      "source_text": "quote from JD"
    }}
  ],

  "education": {{
    "requirement_level": "extracted: required/preferred/not_mentioned",
    "degree_level": "extracted or null",
    "field_of_study": ["extracted"] or null,
    "can_substitute_with_experience": "inferred from text or null"
  }},

  "additional_context": {{
    "industry": "extracted/inferred or null",
    "domain_expertise": ["extracted from JD"] or null",
    "team_size": "extracted if mentioned or null",
    "reporting_to": "extracted if mentioned or null",
    "collaboration": ["extracted teams mentioned"] or null,
    "tools": ["explicitly mentioned tools only"] or null,
    "certifications": ["extracted if mentioned"] or null,
    "work_environment": "extracted: remote/hybrid/onsite or null"
  }},

  "compensation": {{
    "salary_range_inr": {{
      "min": extracted or null,
      "max": extracted or null,
      "currency": "INR/USD/etc or null"
    }},
    "equity_rsu": "extracted if mentioned or null",
    "notice_period_expectation": "extracted if mentioned or null",
    "other_benefits": ["extracted benefits"] or null
  }},

  "meta": {{
    "jd_quality": "high/medium/low - how complete/clear the JD is",
    "ambiguities": ["list any unclear or contradictory parts"],
    "extraction_confidence": "high/medium/low - overall confidence in extraction",
    "recommendations": ["suggestions to improve JD clarity if quality is low"]
  }}
}}"""


class JDBuilderService:
    """Service for generating and parsing job descriptions"""

    async def generate_jd(
        self,
        jd: JobDescription,
        db: Session,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Generate structured JD using LLM

        Args:
            jd: JobDescription database object
            db: Database session
            user_id: User ID for tracking

        Returns:
            Generated JD data dictionary
        """
        try:
            # Prepare prompt with JD details
            prompt = JD_GENERATION_PROMPT.format(
                job_title=jd.job_title or "",
                department=jd.department or "",
                employment_type=jd.employment_type or "",
                location=jd.location or "",
                seniority_level=jd.seniority_level or "",
                min_years=jd.min_years_experience or 0,
                max_years=jd.max_years_experience or 0,
                company_type=jd.company_type or "",
                industry=jd.industry or "",
                prior_roles=jd.prior_roles or "",
            )

            # Update status
            jd.status = JDStatus.GENERATING
            db.commit()

            # Call LLM to generate JD
            llm_service = llm_factory.get_service()
            result = await llm_service.invoke_model(
                prompt=prompt,
                db=db,
                user_id=user_id,
                call_type=LLMCallType.JD_GENERATION,
                job_description_id=str(jd.id),
                max_tokens=6000,
                temperature=0.7,
            )

            if not result["success"]:
                jd.status = JDStatus.FAILED
                jd.error_message = result.get("error")
                db.commit()
                raise ValueError(f"LLM generation failed: {result.get('error')}")

            # Parse JSON response
            try:
                structured_jd = json.loads(result["response"])
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                jd.status = JDStatus.FAILED
                jd.error_message = f"Invalid JSON response: {e}"
                db.commit()
                raise ValueError(f"Invalid JSON response from LLM: {e}")

            # Save structured JD
            jd.structured_jd = structured_jd
            jd.status = JDStatus.COMPLETED
            db.commit()
            db.refresh(jd)

            logger.info(f"Successfully generated JD {jd.id} for: {jd.job_title}")

            return {
                "success": True,
                "jd_id": str(jd.id),
                "structured_jd": structured_jd,
                "usage": result["usage"],
                "cost": result["cost"],
            }

        except Exception as e:
            logger.error(f"JD generation error: {e}")
            jd.status = JDStatus.FAILED
            jd.error_message = str(e)
            db.commit()
            return {
                "success": False,
                "error": str(e),
            }

    async def parse_uploaded_jd(
        self,
        jd_text: str,
        db: Session,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Parse uploaded JD text using LLM

        Args:
            jd_text: Raw JD text
            db: Database session
            user_id: User ID for tracking

        Returns:
            Parsed JD data dictionary with missing fields
        """
        try:
            # Prepare prompt
            prompt = JD_PARSING_PROMPT.format(jd_text=jd_text)

            # Call LLM to parse JD
            llm_service = llm_factory.get_service()
            result = await llm_service.invoke_model(
                prompt=prompt,
                db=db,
                user_id=user_id,
                call_type=LLMCallType.JD_PARSING,
                max_tokens=6000,
                temperature=0.3,
            )

            if not result["success"]:
                raise ValueError(f"LLM parsing failed: {result.get('error')}")

            # Parse JSON response
            try:
                parsed_jd = json.loads(result["response"])
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                raise ValueError(f"Invalid JSON response from LLM: {e}")

            logger.info(f"Successfully parsed uploaded JD")

            return {
                "success": True,
                "parsed_jd": parsed_jd,
                "extraction_status": parsed_jd.get("extraction_status"),
                "missing_fields": parsed_jd.get("missing_fields", []),
                "usage": result["usage"],
                "cost": result["cost"],
            }

        except Exception as e:
            logger.error(f"JD parsing error: {e}")
            return {
                "success": False,
                "error": str(e),
            }

    async def refine_jd(
        self,
        jd: JobDescription,
        user_provided_fields: Dict[str, Any],
        db: Session,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Refine JD with user-provided missing fields

        Args:
            jd: JobDescription database object
            user_provided_fields: Fields provided by user
            db: Database session
            user_id: User ID for tracking

        Returns:
            Refined JD data dictionary
        """
        try:
            # Merge user-provided fields with existing structured JD
            if jd.structured_jd:
                # Update extracted_data with user-provided fields
                extracted_data = jd.structured_jd.get("extracted_data", {})
                extracted_data.update(user_provided_fields)
                jd.structured_jd["extracted_data"] = extracted_data

                # Clear missing_fields since they've been provided
                jd.missing_fields = None
                jd.status = JDStatus.COMPLETED
                db.commit()
                db.refresh(jd)

                logger.info(f"Successfully refined JD {jd.id}")

                return {
                    "success": True,
                    "jd_id": str(jd.id),
                    "structured_jd": jd.structured_jd,
                }
            else:
                raise ValueError("No structured JD data to refine")

        except Exception as e:
            logger.error(f"JD refinement error: {e}")
            return {
                "success": False,
                "error": str(e),
            }


# Singleton instance
jd_builder_service = JDBuilderService()

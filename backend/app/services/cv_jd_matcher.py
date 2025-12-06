"""
CV-JD Matching Service
Matches parsed CV data against Job Descriptions using LLM
"""

import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.llm_factory import llm_factory
from app.models.jd_builder import LLMCallType, JobDescription
import logging

logger = logging.getLogger(__name__)


CV_JD_MATCHING_PROMPT = """You are an expert recruiter analyzing how well a candidate's CV matches a job description.

JOB DESCRIPTION:
{jd_text}

CANDIDATE CV DATA (Parsed):
{cv_data}

Analyze the match between this candidate and the job requirements.

Return ONLY this JSON:

{{
  "overall_match_score": 0-100,
  "match_summary": "2-3 sentence summary of overall fit",

  "technical_skills_match": {{
    "score": 0-100,
    "required_skills_matched": [
      {{
        "skill": "skill name",
        "jd_requirement": "how it appears in JD",
        "cv_evidence": "where/how candidate demonstrated this",
        "proficiency_level": "beginner/intermediate/advanced/expert",
        "years_experience": number,
        "last_used": "YYYY-MM or Present",
        "match_quality": "exact/strong/partial/weak"
      }}
    ],
    "required_skills_missing": [
      {{
        "skill": "skill name",
        "importance": "critical/important/nice-to-have",
        "alternatives_found": ["related skills candidate has"]
      }}
    ],
    "bonus_skills": ["additional relevant skills candidate has"]
  }},

  "experience_match": {{
    "score": 0-100,
    "years_required": "from JD",
    "years_candidate": number,
    "match_assessment": "exceeds/meets/below requirements",
    "relevant_experience_years": number,
    "seniority_match": "matches/above/below expected level",
    "industry_relevance": {{
      "score": 0-100,
      "relevant_industries": ["industries from CV matching JD"],
      "transferable_experience": "explanation"
    }},
    "role_progression": "assessment of career trajectory fit"
  }},

  "education_match": {{
    "score": 0-100,
    "requirements_met": true/false,
    "degree_level_match": "exceeds/meets/below",
    "field_relevance": "highly relevant/relevant/somewhat relevant/not relevant",
    "institution_quality": "tier-1/tier-2/other",
    "additional_certifications": ["relevant certifications"]
  }},

  "soft_skills_match": {{
    "score": 0-100,
    "leadership_evidence": "summary of leadership indicators",
    "communication_indicators": ["evidence from CV"],
    "team_collaboration": "assessment",
    "problem_solving": "assessment"
  }},

  "culture_fit_indicators": {{
    "company_type_match": "assessment (startup/mid-size/MNC experience)",
    "work_environment_fit": "assessment",
    "stability_indicators": {{
      "average_tenure": number_months,
      "job_hopping_risk": "low/medium/high",
      "commitment_indicators": "assessment"
    }}
  }},

  "red_flags": [
    {{
      "flag": "specific concern",
      "severity": "critical/high/medium/low",
      "details": "explanation",
      "mitigating_factors": "any factors that reduce concern"
    }}
  ],

  "strengths": [
    {{
      "strength": "specific strength",
      "evidence": "where demonstrated",
      "relevance_to_role": "how it helps for this position"
    }}
  ],

  "gaps_and_concerns": [
    {{
      "gap": "what's missing or concerning",
      "impact": "critical/high/medium/low",
      "recommendation": "how to address in interview or onboarding"
    }}
  ],

  "recommendation": {{
    "decision": "strong-yes/yes/maybe/no/strong-no",
    "confidence": 0-100,
    "reasoning": "1-2 sentence explanation",
    "interview_focus_areas": ["topics to explore in interview"],
    "next_steps": "suggested next actions"
  }},

  "category_scores": {{
    "technical_fit": 0-100,
    "experience_fit": 0-100,
    "cultural_fit": 0-100,
    "growth_potential": 0-100
  }}
}}

CRITICAL RULES:
1. Be objective and evidence-based
2. Consider skill recency (outdated skills should lower score)
3. Weigh critical requirements heavily
4. Account for transferable skills and learning potential
5. Flag any resume inconsistencies or concerns
6. Return ONLY valid JSON, no additional text"""


class CVJDMatcherService:
    """Service for matching CVs against Job Descriptions"""

    async def match_cv_to_jd(
        self,
        cv_parsed_data: Dict[str, Any],
        job_description: JobDescription,
        db: Session,
        user_id: str,
        cv_id: str,
    ) -> Dict[str, Any]:
        """
        Match a parsed CV against a Job Description using LLM

        Args:
            cv_parsed_data: Parsed CV data dictionary
            job_description: JobDescription object
            db: Database session
            user_id: User ID for tracking
            cv_id: CV ID for tracking

        Returns:
            Matching result dictionary with score and analysis
        """
        try:
            # Get JD text (prefer structured_jd, fallback to original_jd_text)
            if job_description.structured_jd:
                jd_text = json.dumps(job_description.structured_jd, indent=2)
            else:
                jd_text = job_description.original_jd_text or ""

            if not jd_text:
                logger.warning(f"No JD text available for job_description {job_description.id}")
                return {
                    "success": False,
                    "error": "No job description text available",
                }

            # Prepare CV data as JSON string
            cv_data_str = json.dumps(cv_parsed_data, indent=2)

            # Prepare prompt
            prompt = CV_JD_MATCHING_PROMPT.format(
                jd_text=jd_text,
                cv_data=cv_data_str,
            )

            # Call LLM for matching
            result = await llm_factory.get_service().invoke_model(
                prompt=prompt,
                db=db,
                user_id=user_id,
                call_type=LLMCallType.CV_MATCHING,
                cv_id=cv_id,
                jd_id=str(job_description.id),
                max_tokens=6000,
                temperature=0.3,
            )

            if not result["success"]:
                raise ValueError(f"LLM matching failed: {result.get('error')}")

            # Parse JSON response
            try:
                match_data = json.loads(result["response"])
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM matching response as JSON: {e}")
                logger.error(f"Response: {result['response'][:500]}")
                raise ValueError(f"Invalid JSON response from LLM: {e}")

            # Extract overall score
            overall_score = match_data.get("overall_match_score", 0)

            logger.info(f"CV {cv_id} matched against JD {job_description.id}: {overall_score}%")

            return {
                "success": True,
                "match_score": overall_score,
                "match_data": match_data,
                "usage": result["usage"],
                "cost": result["cost"],
            }

        except Exception as e:
            logger.error(f"CV-JD matching error: {e}")
            return {
                "success": False,
                "error": str(e),
            }


# Singleton instance
cv_jd_matcher_service = CVJDMatcherService()

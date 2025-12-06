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


CV_JD_MATCHING_PROMPT = """You are a STRICT technical recruiter evaluating CV-JD match. Most candidates do NOT meet requirements. Be CRITICAL and REALISTIC with scores.

JOB DESCRIPTION:
{jd_text}

CANDIDATE CV DATA:
{cv_data}

SCORING RUBRIC (BE STRICT - most CVs score 30-60):
- 0-20: Poor fit, lacks most critical requirements
- 21-40: Weak fit, missing several important requirements
- 41-60: Moderate fit, meets some requirements but has gaps
- 61-75: Good fit, meets most requirements with minor gaps
- 76-85: Strong fit, meets all requirements well
- 86-95: Excellent fit, exceeds requirements
- 96-100: Perfect fit, exceptional candidate (VERY RARE)

WEIGHTED SCORING FORMULA:
overall_score = (technical_skills × 0.40) + (experience × 0.30) + (education × 0.15) + (soft_skills × 0.15)

PENALTY SYSTEM (SUBTRACT FROM FINAL SCORE):
- Missing 1 critical skill: -15 points
- Missing 2+ critical skills: -30 points
- Experience < 50% required: -20 points
- Outdated skills (>2 years): -10 points per skill
- Job hopping (avg tenure < 12 months): -15 points
- Education below requirement: -10 points
- Critical red flag: -20 points

CALIBRATION EXAMPLES:
- Score 30: Junior applying for senior role, missing 60% skills
- Score 45: Career switcher, transferable skills but no direct experience
- Score 60: Meets 70% requirements, some gaps in critical areas
- Score 75: Solid match, meets requirements, minor skill gaps
- Score 85: Strong candidate, all requirements met, 1-2 years extra experience
- Score 95: Exceptional, exceeds all requirements significantly (RARE)

EVALUATION PROCESS:
1. List EVERY required skill from JD
2. Check if candidate has EACH skill with evidence
3. Calculate exact match percentage for technical skills
4. Compare years of experience (be strict: 3 years means 3+ years)
5. Apply penalties for gaps
6. Calculate weighted score
7. Verify score matches rubric

CRITICAL INSTRUCTIONS:
❌ DO NOT be generous - most candidates are 40-60% matches
❌ DO NOT give benefit of doubt - require explicit evidence
❌ DO NOT inflate scores - be HARSH and REALISTIC
❌ DO NOT give 80+ unless truly exceptional
✅ BE STRICT on years of experience (2 years != 3+ years required)
✅ REQUIRE evidence for every skill claimed
✅ PENALIZE heavily for missing critical requirements
✅ CONSIDER skill recency (React 2018 experience is outdated in 2024)

Return ONLY this JSON:

{{
  "evaluation_process": {{
    "total_required_skills": number,
    "skills_matched_count": number,
    "skills_missing_count": number,
    "critical_skills_missing": ["list of critical missing skills"],
    "skill_match_percentage": number,
    "experience_gap_years": number,
    "penalties_applied": [
      {{
        "reason": "description",
        "points_deducted": number
      }}
    ],
    "total_penalty": number
  }},

  "technical_skills_match": {{
    "score": 0-100,
    "scoring_breakdown": "Explain how you calculated this score",
    "required_skills_matched": [
      {{
        "skill": "skill name",
        "jd_requirement": "from JD",
        "cv_evidence": "specific evidence",
        "proficiency_level": "beginner/intermediate/advanced/expert",
        "years_experience": number,
        "last_used": "YYYY-MM",
        "match_quality": "exact/strong/partial/weak",
        "recency_concern": "if skill is outdated (>2 years old)"
      }}
    ],
    "required_skills_missing": [
      {{
        "skill": "skill name",
        "importance": "critical/important/nice-to-have",
        "impact_on_score": "Explain impact",
        "alternatives_found": ["related skills"]
      }}
    ],
    "bonus_skills": ["additional relevant skills"]
  }},

  "experience_match": {{
    "score": 0-100,
    "scoring_breakdown": "Explain calculation",
    "years_required": number,
    "years_candidate": number,
    "relevant_experience_years": number,
    "experience_gap": "description if below requirement",
    "match_assessment": "exceeds/meets/below requirements",
    "seniority_match": "matches/above/below",
    "industry_relevance": {{
      "score": 0-100,
      "relevant_industries": ["matching industries"],
      "transferable_experience": "explanation"
    }}
  }},

  "education_match": {{
    "score": 0-100,
    "scoring_breakdown": "Explain calculation",
    "requirements_met": true/false,
    "degree_level_match": "exceeds/meets/below",
    "field_relevance": "highly relevant/relevant/somewhat relevant/not relevant",
    "institution_quality": "tier-1/tier-2/tier-3",
    "gap_if_below": "description if doesn't meet requirement"
  }},

  "soft_skills_match": {{
    "score": 0-100,
    "scoring_breakdown": "Explain calculation",
    "leadership_evidence": "specific examples",
    "communication_indicators": ["evidence"],
    "team_collaboration": "assessment with evidence",
    "problem_solving": "assessment with evidence"
  }},

  "red_flags": [
    {{
      "flag": "specific concern",
      "severity": "critical/high/medium/low",
      "details": "explanation",
      "score_impact": "how many points deducted",
      "mitigating_factors": "if any"
    }}
  ],

  "strengths": [
    {{
      "strength": "specific strength",
      "evidence": "concrete evidence",
      "relevance_to_role": "how it helps"
    }}
  ],

  "gaps_and_concerns": [
    {{
      "gap": "what's missing",
      "impact": "critical/high/medium/low",
      "score_impact": "points deducted",
      "recommendation": "how to address"
    }}
  ],

  "score_calculation": {{
    "technical_skills_score": 0-100,
    "experience_score": 0-100,
    "education_score": 0-100,
    "soft_skills_score": 0-100,
    "weighted_base_score": "calculation: (tech×0.4 + exp×0.3 + edu×0.15 + soft×0.15)",
    "total_penalties": number,
    "final_score_before_rounding": number,
    "overall_match_score": 0-100
  }},

  "overall_match_score": 0-100,
  "match_summary": "2-3 sentences: be HONEST about gaps and concerns",

  "recommendation": {{
    "decision": "strong-yes/yes/maybe/no/strong-no",
    "confidence": 0-100,
    "reasoning": "Be brutally honest about fit",
    "interview_focus_areas": ["areas to probe"],
    "concerns_to_validate": ["critical gaps to verify"],
    "next_steps": "suggested action"
  }}
}}

FINAL VALIDATION:
- If missing >2 critical skills, score MUST be <60
- If experience <50% required, score MUST be <50
- If score >80, you MUST justify why candidate is exceptional
- Verify overall_match_score = weighted_base_score - total_penalties

Return ONLY valid JSON, no additional text."""


class CVJDMatcherService:
    """Service for matching CVs against Job Descriptions"""

    def _validate_and_adjust_score(self, match_data: Dict[str, Any]) -> int:
        """
        Validate the LLM-generated score and adjust if needed to prevent score inflation

        This is a safeguard against overly generous LLM scoring
        """
        try:
            # Get component scores
            tech_score = match_data.get("technical_skills_match", {}).get("score", 0)
            exp_score = match_data.get("experience_match", {}).get("score", 0)
            edu_score = match_data.get("education_match", {}).get("score", 0)
            soft_score = match_data.get("soft_skills_match", {}).get("score", 0)

            # Calculate weighted score
            weighted_score = (
                tech_score * 0.40 +
                exp_score * 0.30 +
                edu_score * 0.15 +
                soft_score * 0.15
            )

            # Get evaluation metrics
            eval_process = match_data.get("evaluation_process", {})
            skill_match_pct = eval_process.get("skill_match_percentage", 100)
            critical_missing = eval_process.get("critical_skills_missing", [])
            total_penalty = eval_process.get("total_penalty", 0)

            # Get experience gap
            exp_match = match_data.get("experience_match", {})
            years_required = exp_match.get("years_required", 0)
            years_candidate = exp_match.get("years_candidate", 0)

            # Apply strict validation rules
            calculated_score = int(weighted_score - total_penalty)
            llm_score = match_data.get("overall_match_score", calculated_score)

            # Validation checks - enforce stricter scoring
            adjustments = []

            # Rule 1: Missing critical skills caps score
            if len(critical_missing) >= 2:
                if calculated_score > 55:
                    adjustments.append(f"Missing {len(critical_missing)} critical skills, capping at 55")
                    calculated_score = min(calculated_score, 55)
            elif len(critical_missing) == 1:
                if calculated_score > 70:
                    adjustments.append("Missing 1 critical skill, capping at 70")
                    calculated_score = min(calculated_score, 70)

            # Rule 2: Skill match percentage enforcement
            if skill_match_pct < 50:
                if calculated_score > 45:
                    adjustments.append(f"Only {skill_match_pct}% skills matched, capping at 45")
                    calculated_score = min(calculated_score, 45)
            elif skill_match_pct < 70:
                if calculated_score > 65:
                    adjustments.append(f"Only {skill_match_pct}% skills matched, capping at 65")
                    calculated_score = min(calculated_score, 65)

            # Rule 3: Experience gap enforcement
            if years_required > 0 and years_candidate > 0:
                exp_ratio = years_candidate / years_required
                if exp_ratio < 0.5 and calculated_score > 40:
                    adjustments.append(f"Experience {exp_ratio:.0%} of required, capping at 40")
                    calculated_score = min(calculated_score, 40)
                elif exp_ratio < 0.75 and calculated_score > 60:
                    adjustments.append(f"Experience {exp_ratio:.0%} of required, capping at 60")
                    calculated_score = min(calculated_score, 60)

            # Rule 4: Prevent score inflation - if LLM score is >15 points higher than calculated
            if llm_score > calculated_score + 15:
                adjustments.append(f"LLM score {llm_score} too high vs calculated {calculated_score}, using calculated")
                final_score = calculated_score
            else:
                final_score = llm_score

            # Rule 5: Cap unrealistic high scores
            if final_score > 90 and skill_match_pct < 95:
                adjustments.append("Score >90 requires 95%+ skill match, capping at 85")
                final_score = min(final_score, 85)

            # Log adjustments
            if adjustments:
                logger.info(f"Score adjusted from {llm_score} to {final_score}: {', '.join(adjustments)}")

            return max(0, min(100, final_score))

        except Exception as e:
            logger.error(f"Error validating score: {e}")
            # Fall back to LLM score if validation fails
            return match_data.get("overall_match_score", 0)

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
                # Clean response (remove ```json ... ``` wrapper if present)
                response_text = result["response"].strip()
                if response_text.startswith("```"):
                    response_text = response_text.strip("`")
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                response_text = response_text.strip()

                match_data = json.loads(response_text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM matching response as JSON: {e}")
                logger.error(f"Response: {result['response'][:500]}")
                raise ValueError(f"Invalid JSON response from LLM: {e}")

            # Extract and validate score
            llm_score = match_data.get("overall_match_score", 0)
            validated_score = self._validate_and_adjust_score(match_data)

            # Update match_data with validated score
            if validated_score != llm_score:
                match_data["original_llm_score"] = llm_score
                match_data["overall_match_score"] = validated_score
                match_data["score_adjusted"] = True
                match_data["score_adjustment_reason"] = "Applied strict validation rules to prevent score inflation"
                logger.warning(f"CV {cv_id}: Score adjusted from {llm_score} to {validated_score}")
            else:
                match_data["score_adjusted"] = False

            logger.info(f"CV {cv_id} matched against JD {job_description.id}: {validated_score}% (LLM: {llm_score}%)")

            return {
                "success": True,
                "match_score": validated_score,
                "match_data": match_data,
                "usage": result["usage"],
                "cost": result["cost"]["total_cost"],
            }

        except Exception as e:
            logger.error(f"CV-JD matching error: {e}")
            return {
                "success": False,
                "error": str(e),
            }


# Singleton instance
cv_jd_matcher_service = CVJDMatcherService()

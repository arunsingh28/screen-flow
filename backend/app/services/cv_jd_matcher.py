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


CV_JD_MATCHING_PROMPT = """You are an EXTREMELY STRICT technical recruiter. Your job is to ELIMINATE weak candidates, not find reasons to pass them.

DEFAULT ASSUMPTION: This candidate is probably NOT qualified (40-50% match). Only score higher if they PROVE exceptional fit with concrete evidence.

JOB DESCRIPTION:
{jd_text}

CANDIDATE CV DATA:
{cv_data}

⚠️  CRITICAL: The average score should be 35-55, NOT 70-85. If you consistently score above 65, you are TOO GENEROUS.

REALISTIC SCORING DISTRIBUTION (BE HONEST):
- 0-25: Completely unqualified, wrong field/level
- 26-40: Poor fit, missing most critical skills (MOST junior candidates applying for senior roles)
- 41-55: Below requirements, has some skills but significant gaps (COMMON - career switchers, partial matches)
- 56-65: Meets minimum requirements, notable concerns (AVERAGE qualified candidate)
- 66-75: Solid candidate, meets requirements with minor gaps (GOOD candidate, top 20%)
- 76-85: Strong candidate, exceeds some requirements (VERY GOOD, top 10%)
- 86-95: Exceptional candidate, exceeds most requirements (TOP 5% - RARE)
- 96-100: Perfect unicorn candidate (TOP 1% - EXTREMELY RARE, maybe 1 in 100 CVs)

MANDATORY SCORING RULES - FOLLOW EXACTLY:
1. Start at 50 (neutral baseline, NOT 80)
2. For EACH required skill:
   - Has skill with 3+ years recent experience: +3 points
   - Has skill with <3 years or older experience: +1 point
   - Partial/related skill: +0.5 points
   - Missing skill: -5 points
3. Experience comparison:
   - Exceeds required by 3+ years: +10 points
   - Meets required exactly (±1 year): +5 points
   - 75-99% of required: 0 points
   - 50-74% of required: -10 points
   - <50% of required: -20 points
4. Apply ALL penalties from penalty system below

AGGRESSIVE PENALTY SYSTEM (MANDATORY - DO NOT SKIP):
- Missing 1 critical skill: -15 points
- Missing 2 critical skills: -25 points
- Missing 3+ critical skills: -40 points (score should be <45)
- Experience < 75% required: -15 points
- Experience < 50% required: -30 points
- Outdated primary skill (>2 years): -12 points per skill
- Job hopping (<1 year avg tenure): -20 points
- Education below requirement: -10 points
- Employment gap >1 year: -15 points
- No relevant industry experience: -20 points
- Critical red flag (lying, major gaps): -25 points

CONCRETE EXAMPLES (LEARN FROM THESE):

Example 1 - Score: 38 (TYPICAL for mismatched candidate)
JD: "Senior React Developer, 5+ years React, Node.js, AWS, TypeScript"
CV: "3 years experience, knows React and JavaScript, worked on 2 small projects"
Analysis: Missing Node.js (-5), AWS (-5), TypeScript (-5), only 60% experience required (-10), outdated projects (-12) = 50 - 37 penalties = 38
NEVER score this above 45!

Example 2 - Score: 52 (AVERAGE qualified candidate)
JD: "Mid-level Python Developer, 3+ years Python, Django, PostgreSQL"
CV: "3.5 years Python, strong Django experience, some PostgreSQL, MySQL instead"
Analysis: Has main skills (+3+3+1), meets experience (+5), minor DB difference (0) = 62, no major penalties = 62
This is a TYPICAL acceptable candidate - NOT an 80% match!

Example 3 - Score: 68 (GOOD candidate - top 20%)
JD: "Full-stack Engineer, React, Node, MongoDB, 4+ years"
CV: "5 years experience, expert React/Node, built scalable apps, MongoDB + Redis experience"
Analysis: Exceeds all requirements (+3+3+3), extra experience (+10), bonus skills (+3) = 72, minor concerns (-4) = 68
This is already a STRONG candidate - NOT everyone should score this high!

Example 4 - Score: 89 (EXCEPTIONAL - top 5%, RARE)
JD: "Senior Engineer, React, Node, AWS, CI/CD, 5+ years"
CV: "8 years experience, React expert, architected AWS infrastructure, built CI/CD pipelines, led teams, open source contributions"
Analysis: Exceeds everything significantly, leadership, proven track record, no gaps = 89
YOU WILL RARELY SEE CANDIDATES LIKE THIS - don't give 85+ casually!

WEIGHTED SCORING FORMULA (Apply AFTER calculating component scores):
overall_score = (technical_skills × 0.40) + (experience × 0.30) + (education × 0.15) + (soft_skills × 0.15)

COMPONENT SCORE GUIDELINES:
Technical Skills (0-100):
- Start at 40 (not 70!)
- +8 per critical skill matched with strong evidence
- +4 per important skill matched
- +2 per nice-to-have skill
- -10 per critical skill missing
- MOST CANDIDATES: 30-60 range

Experience (0-100):
- <50% required: 0-30
- 50-75% required: 31-50
- 75-100% required: 51-70
- 100-125% required: 71-85
- >125% required with leadership: 86-95

Education (0-100):
- Below requirement: 0-40
- Meets minimum: 50-70
- Exceeds requirement: 71-90
- Top tier + relevant: 91-100

EVALUATION PROCESS (MANDATORY STEPS):
1. List ALL required skills from JD (technical, tools, frameworks)
2. For EACH skill, find EXPLICIT evidence in CV (job descriptions, projects)
3. Calculate skill_match_percentage = (matched_skills / total_required) × 100
4. Compare years: Calculate experience_ratio = candidate_years / required_years
5. List ALL penalties that apply (be thorough)
6. Calculate component scores using guidelines above
7. Apply weighted formula
8. Subtract total penalties
9. VERIFY final score against rubric and examples

CRITICAL QUALITY CHECKS (MUST PASS BEFORE SUBMITTING):
✅ If skill_match_percentage < 60%, score MUST be < 55
✅ If missing 2+ critical skills, score MUST be < 50
✅ If experience < 75% required, score MUST be < 60
✅ If scoring above 75, write a paragraph justifying why candidate is exceptional
✅ If scoring above 85, candidate must exceed ALL requirements significantly
❌ DO NOT give benefit of doubt - "might have used X" = doesn't count
❌ DO NOT inflate for "good personality" - stick to requirements
❌ DO NOT ignore outdated skills - React 2019 experience is 5 years old in 2024
❌ DO NOT score 80+ unless you're willing to recommend immediate hire

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
        AGGRESSIVELY validate the LLM score and enforce strict caps to prevent score inflation

        This enforces mathematical rules that override LLM leniency
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
            total_required = eval_process.get("total_required_skills", 1)
            skills_missing_count = eval_process.get("skills_missing_count", 0)

            # Get experience gap
            exp_match = match_data.get("experience_match", {})
            years_required = exp_match.get("years_required", 0)
            years_candidate = exp_match.get("years_candidate", 0)

            # Start with calculated score
            calculated_score = int(weighted_score - total_penalty)
            llm_score = match_data.get("overall_match_score", calculated_score)

            # AGGRESSIVE validation rules - multiple caps apply
            adjustments = []

            # Rule 1: Missing critical skills - STRICT CAPS
            if len(critical_missing) >= 3:
                if calculated_score > 45:
                    adjustments.append(f"Missing {len(critical_missing)} critical skills, HARD CAP at 45")
                    calculated_score = min(calculated_score, 45)
            elif len(critical_missing) == 2:
                if calculated_score > 50:
                    adjustments.append("Missing 2 critical skills, capping at 50")
                    calculated_score = min(calculated_score, 50)
            elif len(critical_missing) == 1:
                if calculated_score > 65:
                    adjustments.append("Missing 1 critical skill, capping at 65")
                    calculated_score = min(calculated_score, 65)

            # Rule 2: Total skills missing percentage - AGGRESSIVE
            if total_required > 0:
                missing_pct = (skills_missing_count / total_required) * 100
                if missing_pct >= 50 and calculated_score > 40:
                    adjustments.append(f"Missing {missing_pct:.0f}% of skills, capping at 40")
                    calculated_score = min(calculated_score, 40)
                elif missing_pct >= 40 and calculated_score > 50:
                    adjustments.append(f"Missing {missing_pct:.0f}% of skills, capping at 50")
                    calculated_score = min(calculated_score, 50)
                elif missing_pct >= 30 and calculated_score > 58:
                    adjustments.append(f"Missing {missing_pct:.0f}% of skills, capping at 58")
                    calculated_score = min(calculated_score, 58)

            # Rule 3: Skill match percentage - STRICTER THRESHOLDS
            if skill_match_pct < 40:
                if calculated_score > 35:
                    adjustments.append(f"Only {skill_match_pct:.0f}% skills matched, capping at 35")
                    calculated_score = min(calculated_score, 35)
            elif skill_match_pct < 50:
                if calculated_score > 42:
                    adjustments.append(f"Only {skill_match_pct:.0f}% skills matched, capping at 42")
                    calculated_score = min(calculated_score, 42)
            elif skill_match_pct < 60:
                if calculated_score > 52:
                    adjustments.append(f"Only {skill_match_pct:.0f}% skills matched, capping at 52")
                    calculated_score = min(calculated_score, 52)
            elif skill_match_pct < 70:
                if calculated_score > 60:
                    adjustments.append(f"Only {skill_match_pct:.0f}% skills matched, capping at 60")
                    calculated_score = min(calculated_score, 60)
            elif skill_match_pct < 80:
                if calculated_score > 68:
                    adjustments.append(f"Only {skill_match_pct:.0f}% skills matched, capping at 68")
                    calculated_score = min(calculated_score, 68)

            # Rule 4: Experience gap - MORE AGGRESSIVE
            if years_required > 0 and years_candidate > 0:
                exp_ratio = years_candidate / years_required
                if exp_ratio < 0.5 and calculated_score > 35:
                    adjustments.append(f"Experience only {exp_ratio:.0%} of required, capping at 35")
                    calculated_score = min(calculated_score, 35)
                elif exp_ratio < 0.6 and calculated_score > 45:
                    adjustments.append(f"Experience {exp_ratio:.0%} of required, capping at 45")
                    calculated_score = min(calculated_score, 45)
                elif exp_ratio < 0.75 and calculated_score > 55:
                    adjustments.append(f"Experience {exp_ratio:.0%} of required, capping at 55")
                    calculated_score = min(calculated_score, 55)
                elif exp_ratio < 0.9 and calculated_score > 63:
                    adjustments.append(f"Experience {exp_ratio:.0%} of required, capping at 63")
                    calculated_score = min(calculated_score, 63)

            # Rule 5: Component score caps - don't allow inflated component scores
            if tech_score < 50 and calculated_score > 50:
                adjustments.append(f"Technical score only {tech_score}, capping at 50")
                calculated_score = min(calculated_score, 50)
            if tech_score < 40 and calculated_score > 42:
                adjustments.append(f"Technical score only {tech_score}, capping at 42")
                calculated_score = min(calculated_score, 42)

            # Rule 6: Prevent score inflation - LLM vs calculated difference
            if llm_score > calculated_score + 12:
                adjustments.append(f"LLM score {llm_score} too generous vs calculated {calculated_score}")
                final_score = calculated_score
            elif llm_score > calculated_score + 8:
                adjustments.append(f"LLM score {llm_score} slightly high, averaging with calculated {calculated_score}")
                final_score = int((llm_score + calculated_score) / 2)
            else:
                final_score = min(llm_score, calculated_score)

            # Rule 7: High score must justify with perfect metrics
            if final_score > 85:
                if skill_match_pct < 95 or exp_ratio < 1.2:
                    adjustments.append(f"Score >85 requires 95%+ skills AND 120%+ experience, capping at 75")
                    final_score = min(final_score, 75)
            elif final_score > 75:
                if skill_match_pct < 85:
                    adjustments.append(f"Score >75 requires 85%+ skill match, capping at 68")
                    final_score = min(final_score, 68)
            elif final_score > 65:
                if skill_match_pct < 75:
                    adjustments.append(f"Score >65 requires 75%+ skill match, capping at 58")
                    final_score = min(final_score, 58)

            # Rule 8: Apply global cap based on combined factors
            max_possible = 100
            if len(critical_missing) > 0:
                max_possible = min(max_possible, 70)
            if skill_match_pct < 80:
                max_possible = min(max_possible, 65 + int(skill_match_pct / 5))
            if years_required > 0 and exp_ratio < 1.0:
                max_possible = min(max_possible, 60 + int(exp_ratio * 20))

            if final_score > max_possible:
                adjustments.append(f"Combined factors cap maximum at {max_possible}")
                final_score = min(final_score, max_possible)

            # Log adjustments
            if adjustments:
                logger.warning(f"Score ADJUSTED from {llm_score} to {final_score}: {' | '.join(adjustments)}")

            # Ensure score is in valid range
            return max(0, min(100, final_score))

        except Exception as e:
            logger.error(f"Error validating score: {e}")
            # Fall back to a conservative score if validation fails
            return min(match_data.get("overall_match_score", 50), 50)

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

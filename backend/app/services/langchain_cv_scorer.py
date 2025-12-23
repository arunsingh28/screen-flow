"""
LangChain-based CV Scoring Service
Implements transparent weighted scoring logic with LangChain framework
"""

import json
import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from app.models.jd_builder import JobDescription, LLMCallType
from app.models.job import CV
import logging

logger = logging.getLogger(__name__)


# --- 1. Enhanced Data Models with Granular Scoring ---

class SkillMatch(BaseModel):
    """Individual skill match details"""
    skill: str = Field(description="Skill name from job description")
    found: bool = Field(description="Whether skill is present in CV")
    proficiency_level: Optional[str] = Field(None, description="Candidate's proficiency level")
    years_experience: Optional[float] = Field(None, description="Years of experience with this skill")
    match_quality: str = Field(description="exact/strong/partial/weak/missing")
    points_earned: float = Field(description="Points earned for this skill match")
    evidence: Optional[str] = Field(None, description="Evidence from CV")
    reasoning: str = Field(description="Why this score was given")


class ExperienceAnalysis(BaseModel):
    """Experience evaluation details"""
    years_required: float = Field(description="Years required by JD")
    years_candidate: float = Field(description="Years candidate has")
    match_percentage: float = Field(description="Percentage of required experience")
    score: float = Field(0, ge=0, le=100, description="Experience score 0-100")
    points_earned: float = Field(description="Points earned for experience")
    reasoning: str = Field(description="Detailed reasoning for experience score")


class QualificationAnalysis(BaseModel):
    """Education/qualification evaluation"""
    required_degree: str = Field(description="Required degree from JD")
    candidate_degree: str = Field(description="Candidate's highest degree")
    match_level: str = Field(description="exceeds/meets/below/missing")
    score: float = Field(0, ge=0, le=100, description="Qualification score 0-100")
    points_earned: float = Field(description="Points earned for qualifications")
    reasoning: str = Field(description="Reasoning for qualification score")


class ProjectAnalysis(BaseModel):
    """Project portfolio evaluation"""
    relevant_projects_count: int = Field(description="Number of relevant projects")
    project_quality: str = Field(description="high/medium/low")
    score: float = Field(0, ge=0, le=100, description="Project score 0-100")
    points_earned: float = Field(description="Points earned for projects")
    notable_projects: List[str] = Field(default_factory=list, description="List of notable projects")
    reasoning: str = Field(description="Reasoning for project score")


class ScoringBreakdown(BaseModel):
    """Transparent scoring breakdown"""
    skills_weight: float = Field(50.0, description="Weight percentage for skills")
    experience_weight: float = Field(30.0, description="Weight percentage for experience")
    qualifications_weight: float = Field(10.0, description="Weight percentage for qualifications")
    projects_weight: float = Field(10.0, description="Weight percentage for projects")

    skills_score: float = Field(description="Raw skills score 0-100")
    experience_score: float = Field(description="Raw experience score 0-100")
    qualifications_score: float = Field(description="Raw qualifications score 0-100")
    projects_score: float = Field(description="Raw projects score 0-100")

    weighted_skills: float = Field(description="skills_score × (skills_weight/100)")
    weighted_experience: float = Field(description="experience_score × (experience_weight/100)")
    weighted_qualifications: float = Field(description="qualifications_score × (qualifications_weight/100)")
    weighted_projects: float = Field(description="projects_score × (projects_weight/100)")

    final_score: int = Field(ge=0, le=100, description="Final weighted score (sum of weighted components)")

    calculation_formula: str = Field(
        description="Human-readable formula showing the calculation"
    )


class DetailedEvaluationResult(BaseModel):
    """Comprehensive evaluation result with full transparency"""

    # Overall score
    match_score: int = Field(ge=0, le=100, description="Final match score 0-100")

    # Component analyses
    skills_analysis: Dict[str, Any] = Field(description="Detailed skills matching analysis")
    experience_analysis: ExperienceAnalysis = Field(description="Experience evaluation")
    qualifications_analysis: QualificationAnalysis = Field(description="Qualifications evaluation")
    projects_analysis: ProjectAnalysis = Field(description="Projects evaluation")

    # Scoring breakdown
    scoring_breakdown: ScoringBreakdown = Field(description="Transparent scoring calculation")

    # Skills details
    skills_matched: List[SkillMatch] = Field(description="All matched skills with details")
    skills_missing: List[SkillMatch] = Field(description="All missing skills with impact")

    # Summary
    missing_requirements: List[str] = Field(description="Critical missing requirements")
    key_strengths: List[str] = Field(description="Candidate's key strengths for this role")
    red_flags: List[str] = Field(default_factory=list, description="Any concerns or red flags")

    # Recommendation
    recommendation: str = Field(description="strong-reject/reject/maybe/recommend/strong-recommend")
    confidence: int = Field(ge=0, le=100, description="Confidence in this evaluation")
    reasoning: str = Field(description="Overall reasoning for the score and recommendation")


# --- 2. LangChain-based CV Scoring Service ---

CV_SCORING_PROMPT = """You are an expert HR recruiter performing CV evaluation with TRANSPARENT WEIGHTED SCORING.

JOB DESCRIPTION:
{job_description}

CANDIDATE CV DATA:
{cv_data}

SCORING METHODOLOGY:
You must evaluate the candidate across 4 dimensions with specific weights:

1. SKILLS MATCH (50% weight)
   - Identify ALL required technical skills from JD
   - For each skill, check if candidate has it
   - Score based on proficiency and recency:
     * Expert level + recent (< 1 year old): 10 points
     * Advanced level + recent: 8 points
     * Intermediate + recent: 6 points
     * Beginner or outdated (>2 years): 3 points
     * Missing critical skill: 0 points
   - Calculate: (total_points_earned / total_possible_points) × 100
   - Skills score should be 0-100

2. EXPERIENCE MATCH (30% weight)
   - Compare candidate years vs required years
   - Scoring rubric:
     * ≥150% of required: 95-100 points
     * 120-149% of required: 85-94 points
     * 100-119% of required: 75-84 points
     * 80-99% of required: 60-74 points
     * 60-79% of required: 40-59 points
     * 40-59% of required: 20-39 points
     * <40% of required: 0-19 points
   - Consider relevance of experience (industry, role similarity)
   - Experience score should be 0-100

3. QUALIFICATIONS MATCH (10% weight)
   - Check degree level (PhD > Masters > Bachelors > Diploma)
   - Check field relevance (CS/IT/related vs non-technical)
   - Scoring rubric:
     * Exceeds requirement (e.g., Masters when Bachelor required): 90-100
     * Exactly meets requirement: 70-85
     * Slightly below (e.g., Bachelor when Masters preferred): 50-69
     * Significantly below: 20-49
     * Missing minimum qualification: 0-19
   - Qualifications score should be 0-100

4. PROJECTS MATCH (10% weight)
   - Evaluate quality and relevance of projects
   - Consider:
     * Number of relevant projects
     * Complexity and scale
     * Technologies used
     * Recency (recent projects weighted higher)
   - Scoring rubric:
     * 5+ high-quality relevant projects: 90-100
     * 3-4 quality projects: 70-89
     * 1-2 relevant projects: 50-69
     * Only unrelated or academic projects: 20-49
     * No projects mentioned: 0-19
   - Projects score should be 0-100

FINAL SCORE CALCULATION:
final_score = (skills_score × 0.50) + (experience_score × 0.30) + (qualifications_score × 0.10) + (projects_score × 0.10)

CRITICAL REQUIREMENTS:
1. List EVERY skill from JD and mark as matched/missing
2. Provide evidence from CV for each matched skill
3. Calculate points earned for each component transparently
4. Show the weighted calculation step-by-step
5. Provide reasoning for every score
6. Be consistent: Don't inflate scores without evidence

RECOMMENDATIONS:
- 80-100: strong-recommend (Excellent match, should interview immediately)
- 65-79: recommend (Good match, proceed with interview)
- 50-64: maybe (Average match, consider if candidates are scarce)
- 35-49: reject (Below requirements, significant gaps)
- 0-34: strong-reject (Poor match, not qualified)

Return ONLY valid JSON matching the schema, no additional text."""


class LangChainCVScoringService:
    """Service for CV scoring using LangChain with transparent weighted logic"""

    def __init__(self):
        """Initialize the LangChain scoring service"""
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.temperature = 0.2  # Lower for more consistent scoring

    def _create_llm(self) -> ChatOpenAI:
        """Create and configure the LLM"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        return ChatOpenAI(
            model=self.model_name,
            temperature=self.temperature,
            api_key=api_key,
        )

    def _prepare_cv_summary(self, cv_parsed_data: Dict[str, Any]) -> str:
        """
        Convert parsed CV data into a concise summary for the prompt

        Args:
            cv_parsed_data: Parsed CV data from CVParseDetail

        Returns:
            Formatted CV summary string
        """
        skills_data = cv_parsed_data.get("skills", {})
        technical_skills = skills_data.get("technical_skills", [])

        # Extract skill names and experience
        skills_summary = []
        for skill in technical_skills:
            if isinstance(skill, dict):
                skill_name = skill.get("skill", "")
                years = skill.get("total_years_experience", 0)
                proficiency = skill.get("proficiency", "")
                last_used = skill.get("last_used", "")
                skills_summary.append(f"{skill_name} ({proficiency}, {years}+ years, last used: {last_used})")
            else:
                skills_summary.append(str(skill))

        # Extract qualifications
        education = cv_parsed_data.get("education", [])
        qualifications = []
        for edu in education:
            if isinstance(edu, dict):
                degree = edu.get("degree", "")
                field = edu.get("field", "")
                institution = edu.get("institution", "")
                year = edu.get("graduation_year", "")
                qualifications.append(f"{degree} in {field} from {institution} ({year})")
            else:
                qualifications.append(str(edu))

        # Extract experience
        work_exp = cv_parsed_data.get("work_experience", [])
        experience = []
        for exp in work_exp:
            if isinstance(exp, dict):
                company = exp.get("company", "")
                role = exp.get("role", "")
                duration = exp.get("duration_months", 0)
                tech_stack = exp.get("tech_stack", [])
                experience.append(
                    f"{role} at {company} ({duration} months) - Tech: {', '.join(tech_stack[:5])}"
                )

        # Extract projects
        projects_data = cv_parsed_data.get("projects", [])
        projects = []
        for proj in projects_data:
            if isinstance(proj, dict):
                name = proj.get("name", "")
                description = proj.get("description", "")
                technologies = proj.get("technologies", [])
                projects.append(f"{name}: {description} - Tech: {', '.join(technologies[:5])}")

        # Get summary info
        summary = cv_parsed_data.get("summary", {})
        total_experience = summary.get("total_experience_years", 0)
        current_role = summary.get("current_role", "")
        career_level = summary.get("career_level", "")

        # Format the summary
        cv_summary = f"""
SUMMARY:
- Total Experience: {total_experience} years
- Current Role: {current_role}
- Career Level: {career_level}

SKILLS:
{chr(10).join(['- ' + s for s in skills_summary[:20]])}  # Limit to 20 skills

QUALIFICATIONS:
{chr(10).join(['- ' + q for q in qualifications])}

WORK EXPERIENCE:
{chr(10).join(['- ' + e for e in experience[:5]])}  # Limit to 5 most recent

PROJECTS:
{chr(10).join(['- ' + p for p in projects[:5]])}  # Limit to 5 projects
        """.strip()

        return cv_summary

    def _prepare_jd_text(self, job_description: JobDescription) -> str:
        """
        Extract job description text from JobDescription object

        Args:
            job_description: JobDescription database object

        Returns:
            Formatted JD text
        """
        if job_description.structured_jd:
            # If we have structured JD, format it nicely
            structured = job_description.structured_jd

            jd_text = f"""
JOB TITLE: {job_description.job_title or 'Not specified'}
DEPARTMENT: {job_description.department or 'Not specified'}
EXPERIENCE REQUIRED: {job_description.min_years_experience or 0}-{job_description.max_years_experience or 0} years
SENIORITY LEVEL: {job_description.seniority_level or 'Not specified'}

STRUCTURED JOB DESCRIPTION:
{json.dumps(structured, indent=2)}
            """.strip()
        else:
            jd_text = job_description.original_jd_text or ""

        return jd_text

    async def evaluate_candidate(
        self,
        cv_parsed_data: Dict[str, Any],
        job_description: JobDescription,
        db: Session,
        user_id: str,
        cv_id: str,
    ) -> Dict[str, Any]:
        """
        Evaluate a candidate using LangChain with transparent weighted scoring

        Args:
            cv_parsed_data: Parsed CV data dictionary
            job_description: JobDescription object
            db: Database session
            user_id: User ID for tracking
            cv_id: CV ID for tracking

        Returns:
            Evaluation result dictionary with score and detailed analysis
        """
        try:
            # Initialize LLM and parser
            llm = self._create_llm()
            parser = JsonOutputParser(pydantic_object=DetailedEvaluationResult)

            # Prepare data
            cv_summary = self._prepare_cv_summary(cv_parsed_data)
            jd_text = self._prepare_jd_text(job_description)

            # Create prompt
            prompt = PromptTemplate(
                template=CV_SCORING_PROMPT,
                input_variables=["job_description", "cv_data"],
                partial_variables={"format_instructions": parser.get_format_instructions()},
            )

            # Create chain
            chain = prompt | llm | parser

            logger.info(f"Evaluating CV {cv_id} with LangChain scoring service")

            # Invoke chain
            result = chain.invoke({
                "job_description": jd_text,
                "cv_data": cv_summary,
            })

            # Validate the result is a DetailedEvaluationResult
            evaluation = DetailedEvaluationResult(**result)

            # Convert to dictionary for storage
            match_data = evaluation.model_dump()

            logger.info(
                f"CV {cv_id} evaluated: Score {evaluation.match_score}/100, "
                f"Recommendation: {evaluation.recommendation}"
            )

            return {
                "success": True,
                "match_score": evaluation.match_score,
                "match_data": match_data,
                "scoring_method": "langchain_weighted",
            }

        except Exception as e:
            logger.error(f"LangChain CV scoring error: {e}")
            return {
                "success": False,
                "error": str(e),
            }


# Singleton instance
langchain_cv_scoring_service = LangChainCVScoringService()

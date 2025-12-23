"""
Platform Insights Analyzer
Uses LLM to generate meaningful insights from GitHub, LinkedIn, and other platform data
"""

import os
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import logging

logger = logging.getLogger(__name__)


# --- Pydantic Models for Structured Insights ---

class GitHubInsights(BaseModel):
    """Meaningful insights from GitHub profile"""
    overall_assessment: str = Field(description="2-3 sentence summary of GitHub presence and activity")
    coding_style: str = Field(description="Assessment of code quality and practices")
    technical_depth: str = Field(description="Evaluation of technical expertise based on repositories")
    collaboration_style: str = Field(description="How they collaborate (PRs, issues, contributions)")
    standout_projects: list[str] = Field(description="Most impressive projects with context")
    red_flags: list[str] = Field(default_factory=list, description="Any concerns")
    green_flags: list[str] = Field(default_factory=list, description="Positive indicators")
    skill_validation: str = Field(description="How GitHub activity validates CV claims")
    activity_level: str = Field(description="high/medium/low/inactive")
    recommendation: str = Field(description="Should we focus on this in interview?")


class LinkedInInsights(BaseModel):
    """Meaningful insights from LinkedIn profile"""
    professional_brand: str = Field(description="How they present themselves professionally")
    network_quality: str = Field(description="Assessment of connections and endorsements")
    content_engagement: str = Field(description="Do they share/create valuable content?")
    career_progression_story: str = Field(description="Narrative of their career growth")
    validation_points: list[str] = Field(description="Points that validate CV claims")
    concerns: list[str] = Field(default_factory=list, description="Any inconsistencies or concerns")


class PortfolioInsights(BaseModel):
    """Insights from personal portfolio/website"""
    presentation_quality: str = Field(description="Quality of portfolio presentation")
    project_showcase: str = Field(description="How well they showcase their work")
    technical_writing: str = Field(description="Quality of explanations and documentation")
    standout_elements: list[str] = Field(description="What makes this portfolio impressive")
    areas_for_improvement: list[str] = Field(default_factory=list)


class ComprehensiveCandidateInsights(BaseModel):
    """Complete candidate insights from all platforms"""
    overall_impression: str = Field(description="3-4 sentence overall assessment across platforms")
    consistency_check: str = Field(description="Are CV, GitHub, LinkedIn consistent?")
    authenticity_score: int = Field(ge=0, le=100, description="How authentic does the candidate appear?")
    passion_indicators: list[str] = Field(description="Signs they're passionate about tech")
    culture_fit_indicators: list[str] = Field(description="Signs of culture fit or concerns")
    interview_focus_areas: list[str] = Field(description="What to probe in interview")
    unique_strengths: list[str] = Field(description="What makes this candidate stand out")
    github_insights: Optional[GitHubInsights] = None
    linkedin_insights: Optional[LinkedInInsights] = None
    portfolio_insights: Optional[PortfolioInsights] = None


# --- LLM Prompts ---

GITHUB_ANALYSIS_PROMPT = """You are an expert engineering manager evaluating a candidate's GitHub profile.

CANDIDATE CV SUMMARY:
{cv_summary}

GITHUB PROFILE DATA:
{github_data}

TASK: Generate meaningful, actionable insights about this candidate based on their GitHub presence.

Focus on:
1. Code Quality: Look at commit messages, code organization, documentation
2. Technical Depth: What technologies do they truly understand? Look at complexity
3. Consistency: Does GitHub activity match CV claims?
4. Collaboration: How do they work with others? (PRs, issues, code reviews)
5. Passion: Side projects, contributions, learning initiatives
6. Red/Green Flags: Any concerns or impressive indicators

Be honest and balanced. Don't just list stats - interpret them.

Return ONLY valid JSON, no additional text.

{format_instructions}
"""

COMPREHENSIVE_ANALYSIS_PROMPT = """You are an expert recruiter doing a 360° assessment of a candidate.

CANDIDATE CV:
{cv_summary}

GITHUB DATA:
{github_data}

LINKEDIN DATA (if available):
{linkedin_data}

PORTFOLIO/WEBSITE (if available):
{portfolio_data}

TASK: Synthesize all available information to create a comprehensive, meaningful assessment.

Consider:
1. Consistency: Do all platforms tell the same story? Any red flags?
2. Authenticity: Does this feel like a real, passionate developer or someone gaming the system?
3. Depth vs Breadth: Do they go deep or stay surface-level?
4. Culture Signals: Any indicators about work style, values, collaboration?
5. Passion: Evidence of genuine interest beyond just employment?
6. Interview Strategy: What should we probe or validate?

Be specific and actionable. Provide insights that help make better hiring decisions.

Return ONLY valid JSON, no additional text.

{format_instructions}
"""


class PlatformInsightsAnalyzer:
    """Service for analyzing platform data with LLM to generate meaningful insights"""

    def __init__(self):
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.temperature = 0.3

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
        """Extract key points from CV for context"""
        summary = cv_parsed_data.get("summary", {})
        skills = cv_parsed_data.get("skills", {})
        work_exp = cv_parsed_data.get("work_experience", [])[:3]  # Top 3 jobs

        tech_skills = [s.get("skill") for s in skills.get("technical_skills", [])[:10] if isinstance(s, dict)]

        recent_roles = []
        for exp in work_exp:
            if isinstance(exp, dict):
                recent_roles.append(f"{exp.get('role')} at {exp.get('company')}")

        return f"""
Name: {cv_parsed_data.get('personal_info', {}).get('name', 'N/A')}
Experience: {summary.get('total_experience_years', 0)} years
Current Role: {summary.get('current_role', 'N/A')}
Key Skills: {', '.join(tech_skills)}
Recent Roles: {'; '.join(recent_roles)}
        """.strip()

    async def analyze_github(
        self,
        github_data: Dict[str, Any],
        cv_parsed_data: Dict[str, Any]
    ) -> Optional[GitHubInsights]:
        """
        Analyze GitHub profile with LLM to generate meaningful insights

        Args:
            github_data: Raw GitHub data from API
            cv_parsed_data: Parsed CV data for context

        Returns:
            GitHubInsights or None if analysis fails
        """
        try:
            if not github_data or not github_data.get("profile"):
                logger.info("No GitHub data available for analysis")
                return None

            llm = self._create_llm()
            parser = JsonOutputParser(pydantic_object=GitHubInsights)

            cv_summary = self._prepare_cv_summary(cv_parsed_data)

            # Format GitHub data for analysis
            profile = github_data.get("profile", {})
            analysis = github_data.get("analysis", {})
            top_repos = github_data.get("top_repositories", [])[:5]
            languages = github_data.get("language_stats", {})

            github_summary = f"""
PROFILE:
- Username: {profile.get('login', 'N/A')}
- Public Repos: {profile.get('public_repos', 0)}
- Followers: {profile.get('followers', 0)}
- Following: {profile.get('following', 0)}
- Bio: {profile.get('bio', 'N/A')}
- Company: {profile.get('company', 'N/A')}
- Location: {profile.get('location', 'N/A')}
- Created: {profile.get('created_at', 'N/A')}
- Last Updated: {profile.get('updated_at', 'N/A')}

ACTIVITY ANALYSIS:
{analysis}

TOP REPOSITORIES:
{chr(10).join([f"- {repo.get('name')}: {repo.get('description', 'No description')} (⭐ {repo.get('stargazers_count', 0)}, Language: {repo.get('language', 'N/A')})" for repo in top_repos])}

LANGUAGES:
{', '.join([f"{lang}: {stats.get('percentage', 0):.1f}%" for lang, stats in list(languages.items())[:8]])}
            """.strip()

            prompt = PromptTemplate(
                template=GITHUB_ANALYSIS_PROMPT,
                input_variables=["cv_summary", "github_data"],
                partial_variables={"format_instructions": parser.get_format_instructions()},
            )

            chain = prompt | llm | parser

            logger.info("Analyzing GitHub profile with LLM")

            result = chain.invoke({
                "cv_summary": cv_summary,
                "github_data": github_summary,
            })

            insights = GitHubInsights(**result)
            logger.info(f"GitHub analysis complete: {insights.overall_assessment[:50]}...")

            return insights

        except Exception as e:
            logger.error(f"GitHub analysis failed: {e}")
            return None

    async def analyze_comprehensive(
        self,
        cv_parsed_data: Dict[str, Any],
        github_data: Optional[Dict[str, Any]] = None,
        linkedin_data: Optional[Dict[str, Any]] = None,
        portfolio_data: Optional[Dict[str, Any]] = None
    ) -> Optional[ComprehensiveCandidateInsights]:
        """
        Generate comprehensive insights from all available platform data

        Args:
            cv_parsed_data: Parsed CV data
            github_data: GitHub profile data (optional)
            linkedin_data: LinkedIn profile data (optional)
            portfolio_data: Portfolio/website data (optional)

        Returns:
            ComprehensiveCandidateInsights or None
        """
        try:
            # First analyze GitHub separately if available
            github_insights = None
            if github_data:
                github_insights = await self.analyze_github(github_data, cv_parsed_data)

            llm = self._create_llm()
            parser = JsonOutputParser(pydantic_object=ComprehensiveCandidateInsights)

            cv_summary = self._prepare_cv_summary(cv_parsed_data)

            # Format all platform data
            github_summary = str(github_data) if github_data else "Not available"
            linkedin_summary = str(linkedin_data) if linkedin_data else "Not available"
            portfolio_summary = str(portfolio_data) if portfolio_data else "Not available"

            prompt = PromptTemplate(
                template=COMPREHENSIVE_ANALYSIS_PROMPT,
                input_variables=["cv_summary", "github_data", "linkedin_data", "portfolio_data"],
                partial_variables={"format_instructions": parser.get_format_instructions()},
            )

            chain = prompt | llm | parser

            logger.info("Generating comprehensive candidate insights")

            result = chain.invoke({
                "cv_summary": cv_summary,
                "github_data": github_summary,
                "linkedin_data": linkedin_summary,
                "portfolio_data": portfolio_summary,
            })

            insights = ComprehensiveCandidateInsights(**result)

            # Attach GitHub insights if generated
            if github_insights:
                insights.github_insights = github_insights

            logger.info(f"Comprehensive analysis complete: {insights.overall_impression[:50]}...")

            return insights

        except Exception as e:
            logger.error(f"Comprehensive analysis failed: {e}")
            return None


# Singleton instance
platform_insights_analyzer = PlatformInsightsAnalyzer()

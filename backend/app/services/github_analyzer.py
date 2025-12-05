"""
GitHub Profile Analyzer Service
Analyzes GitHub profiles to validate CV claims
"""

import json
from typing import Dict, Any, Optional
from github import Github, GithubException
from sqlalchemy.orm import Session
from app.services.llm_factory import llm_factory
from app.models.jd_builder import LLMCallType, GitHubAnalysis, CVParseDetail
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


GITHUB_ANALYSIS_PROMPT = """You are an expert technical recruiter analyzing a candidate's GitHub profile to validate their technical skills and assess code quality.

CANDIDATE CV SKILLS:
{cv_technical_skills}

GITHUB PROFILE DATA:
- Username: {username}
- Name: {name}
- Bio: {bio}
- Company: {company}
- Location: {location}
- Followers: {followers}
- Following: {following}
- Public Repos: {public_repos}
- Account Created: {created_at}
- Last Updated: {updated_at}

TOP REPOSITORIES (by stars):
{top_repos}

LANGUAGES USED:
{languages}

RECENT ACTIVITY (last 6 months):
{recent_activity}

YOUR TASK:
Analyze the GitHub profile to:
1. Validate CV claims about technical skills
2. Assess code quality and engagement
3. Identify green flags and red flags
4. Determine skill recency and depth
5. Evaluate open source contributions

Return ONLY this JSON:

{{
  "github_score": 0-100,

  "skill_validation": {{
    "verified_skills": [
      {{
        "skill": "skill from CV",
        "github_evidence": "specific evidence from GitHub",
        "confidence": "high/medium/low",
        "recency": "active/recent/outdated",
        "depth_assessment": "expert/advanced/intermediate/beginner based on code"
      }}
    ],

    "unverified_skills": [
      {{
        "skill": "skill from CV",
        "reason": "why no GitHub evidence found"
      }}
    ],

    "additional_skills_found": [
      {{
        "skill": "skill found on GitHub but not in CV",
        "evidence": "where found",
        "relevance": "how relevant to role"
      }}
    ]
  }},

  "activity_assessment": {{
    "activity_level": "high/medium/low/inactive",
    "last_activity": "human-readable",
    "consistency": "regular/sporadic/inactive",
    "interpretation": "what this activity level indicates"
  }},

  "code_quality_assessment": {{
    "quality_score": 0-100,
    "indicators": {{
      "well_documented": true/false,
      "follows_best_practices": true/false,
      "production_ready": true/false,
      "modern_tooling": true/false,
      "testing": true/false
    }},
    "evidence": "specific examples",
    "concerns": ["any code quality issues"]
  }},

  "project_highlights": [
    {{
      "project": "repo name",
      "why_impressive": "explanation",
      "relevance_to_role": "high/medium/low",
      "key_takeaway": "what this demonstrates"
    }}
  ],

  "open_source_contribution": {{
    "level": "maintainer/active_contributor/occasional_contributor/none",
    "notable_contributions": ["descriptions"],
    "community_engagement": "assessment"
  }},

  "green_flags": [
    {{
      "flag": "positive signal",
      "evidence": "observed",
      "impact": "why this matters",
      "weight": "high/medium/low"
    }}
  ],

  "red_flags": [
    {{
      "flag": "concern",
      "evidence": "observed",
      "severity": "high/medium/low",
      "mitigation": "questions to ask"
    }}
  ],

  "skill_recency_validation": {{
    "actively_using": ["skills with recent commits"],
    "recently_used": ["skills used 3-12 months ago"],
    "outdated_on_github": ["skills not in recent activity"]
  }},

  "overall_assessment": {{
    "summary": "2-3 sentence take",
    "cv_github_alignment": "strong/moderate/weak",
    "recommendation": "interview focus areas"
  }}
}}"""


class GitHubAnalyzerService:
    """Service for analyzing GitHub profiles"""

    def __init__(self, github_token: Optional[str] = None):
        """Initialize GitHub API client"""
        if github_token:
            self.github = Github(github_token)
        else:
            self.github = Github()  # Anonymous API (rate limited)

    def fetch_github_data(self, username: str) -> Dict[str, Any]:
        """
        Fetch GitHub profile data

        Args:
            username: GitHub username

        Returns:
            Dictionary with profile data
        """
        try:
            user = self.github.get_user(username)

            # Get repositories
            repos = list(user.get_repos(sort="updated"))

            # Top repositories by stars
            top_repos = sorted(repos, key=lambda r: r.stargazers_count, reverse=True)[:10]

            # Calculate language usage
            languages = {}
            for repo in repos:
                if repo.language:
                    languages[repo.language] = languages.get(repo.language, 0) + 1

            # Get recent activity (last 6 months)
            recent_repos = [
                r for r in repos
                if (datetime.now(timezone.utc) - r.updated_at).days < 180
            ]

            return {
                "success": True,
                "profile": {
                    "username": user.login,
                    "name": user.name,
                    "bio": user.bio,
                    "company": user.company,
                    "location": user.location,
                    "followers": user.followers,
                    "following": user.following,
                    "public_repos": user.public_repos,
                    "created_at": user.created_at.isoformat(),
                    "updated_at": user.updated_at.isoformat() if user.updated_at else None,
                },
                "top_repos": [
                    {
                        "name": repo.name,
                        "description": repo.description,
                        "stars": repo.stargazers_count,
                        "forks": repo.forks_count,
                        "language": repo.language,
                        "updated_at": repo.updated_at.isoformat(),
                        "topics": repo.get_topics(),
                    }
                    for repo in top_repos
                ],
                "languages": languages,
                "recent_activity": {
                    "recent_repos_count": len(recent_repos),
                    "recent_repos": [
                        {
                            "name": repo.name,
                            "language": repo.language,
                            "updated_at": repo.updated_at.isoformat(),
                        }
                        for repo in recent_repos[:5]
                    ],
                },
            }

        except GithubException as e:
            logger.error(f"GitHub API error for {username}: {e}")
            return {
                "success": False,
                "error": f"GitHub API error: {e.data.get('message', str(e))}",
            }
        except Exception as e:
            logger.error(f"Error fetching GitHub data for {username}: {e}")
            return {
                "success": False,
                "error": str(e),
            }

    async def analyze_github_profile(
        self,
        cv_parse_detail: CVParseDetail,
        db: Session,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Analyze GitHub profile using LLM

        Args:
            cv_parse_detail: CV parse detail object
            db: Database session
            user_id: User ID for tracking

        Returns:
            Analysis result dictionary
        """
        try:
            username = cv_parse_detail.github_username

            if not username:
                return {
                    "success": False,
                    "error": "No GitHub username found in CV",
                }

            # Fetch GitHub data
            github_data = self.fetch_github_data(username)

            if not github_data["success"]:
                return github_data

            # Extract CV technical skills
            parsed_data = cv_parse_detail.parsed_data
            technical_skills = parsed_data.get("skills", {}).get("technical_skills", [])
            cv_skills_text = json.dumps(technical_skills, indent=2)

            # Format GitHub data for prompt
            profile = github_data["profile"]
            top_repos_text = json.dumps(github_data["top_repos"], indent=2)
            languages_text = json.dumps(github_data["languages"], indent=2)
            recent_activity_text = json.dumps(github_data["recent_activity"], indent=2)

            # Prepare prompt
            prompt = GITHUB_ANALYSIS_PROMPT.format(
                cv_technical_skills=cv_skills_text,
                username=profile["username"],
                name=profile["name"] or "N/A",
                bio=profile["bio"] or "N/A",
                company=profile["company"] or "N/A",
                location=profile["location"] or "N/A",
                followers=profile["followers"],
                following=profile["following"],
                public_repos=profile["public_repos"],
                created_at=profile["created_at"],
                updated_at=profile["updated_at"] or "N/A",
                top_repos=top_repos_text,
                languages=languages_text,
                recent_activity=recent_activity_text,
            )

            # Call LLM to analyze
            result = await llm_factory.get_service().invoke_model(
                prompt=prompt,
                db=db,
                user_id=user_id,
                call_type=LLMCallType.GITHUB_ANALYSIS,
                cv_parse_detail_id=str(cv_parse_detail.id),
                max_tokens=6000,
                temperature=0.3,
            )

            if not result["success"]:
                raise ValueError(f"LLM analysis failed: {result.get('error')}")

            # Parse JSON response
            try:
                analysis_data = json.loads(result["response"])
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                raise ValueError(f"Invalid JSON response from LLM: {e}")

            # Calculate days since last activity
            updated_at = datetime.fromisoformat(profile["updated_at"].replace("Z", "+00:00")) if profile["updated_at"] else None
            days_since_last_activity = (datetime.now(timezone.utc) - updated_at).days if updated_at else None

            # Create GitHub analysis record
            github_analysis = GitHubAnalysis(
                cv_parse_detail_id=cv_parse_detail.id,
                user_id=user_id,
                github_username=username,
                analysis_data=analysis_data,
                github_score=analysis_data.get("github_score"),
                activity_level=analysis_data.get("activity_assessment", {}).get("activity_level"),
                last_activity_date=updated_at,
                days_since_last_activity=days_since_last_activity,
                code_quality_score=analysis_data.get("code_quality_assessment", {}).get("quality_score"),
                green_flags_count=len(analysis_data.get("green_flags", [])),
                red_flags_count=len(analysis_data.get("red_flags", [])),
                cv_github_alignment=analysis_data.get("overall_assessment", {}).get("cv_github_alignment"),
                success=True,
            )

            db.add(github_analysis)
            db.commit()
            db.refresh(github_analysis)

            logger.info(f"Successfully analyzed GitHub profile for {username}")

            return {
                "success": True,
                "github_analysis_id": str(github_analysis.id),
                "analysis_data": analysis_data,
                "usage": result["usage"],
                "cost": result["cost"],
            }

        except Exception as e:
            logger.error(f"GitHub analysis error: {e}")

            # Create failed analysis record
            if cv_parse_detail.github_username:
                github_analysis = GitHubAnalysis(
                    cv_parse_detail_id=cv_parse_detail.id,
                    user_id=user_id,
                    github_username=cv_parse_detail.github_username,
                    analysis_data={},
                    success=False,
                    error_message=str(e),
                )
                db.add(github_analysis)
                db.commit()

            return {
                "success": False,
                "error": str(e),
            }


# Singleton instance
github_analyzer_service = GitHubAnalyzerService()

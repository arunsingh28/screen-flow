"""
TOON Service - Token-Oriented Object Notation for LLM optimization
Reduces token usage by 30-60% compared to JSON
"""

from typing import Any, Dict, Union
import logging

logger = logging.getLogger(__name__)

try:
    from toon_format import encode, decode
    TOON_AVAILABLE = True
except ImportError:
    logger.warning("toon_format not installed. Install with: pip install git+https://github.com/toon-format/toon-python.git")
    TOON_AVAILABLE = False


class TOONService:
    """Service for encoding/decoding data using TOON format"""

    def __init__(self):
        self.enabled = TOON_AVAILABLE

    def encode_data(self, data: Any) -> str:
        """
        Encode data to TOON format for LLM prompts

        Args:
            data: Python dict, list, or primitive to encode

        Returns:
            TOON-formatted string (or JSON fallback if TOON unavailable)

        Example:
            >>> encode_data({"name": "Alice", "age": 30})
            "name: Alice\\nage: 30"

            >>> encode_data([{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}])
            "[2,]{id,name}:\\n1,Alice\\n2,Bob"
        """
        if not self.enabled:
            # Fallback to JSON if TOON not available
            import json
            return json.dumps(data, indent=2)

        try:
            return encode(data)
        except Exception as e:
            logger.error(f"TOON encoding error: {e}. Falling back to JSON.")
            import json
            return json.dumps(data, indent=2)

    def decode_data(self, toon_str: str) -> Any:
        """
        Decode TOON-formatted string back to Python objects

        Args:
            toon_str: TOON-formatted string

        Returns:
            Python dict, list, or primitive

        Example:
            >>> decode_data("name: Alice\\nage: 30")
            {"name": "Alice", "age": 30}
        """
        if not self.enabled:
            # Try JSON parsing as fallback
            import json
            try:
                return json.loads(toon_str)
            except:
                return toon_str

        try:
            return decode(toon_str)
        except Exception as e:
            logger.error(f"TOON decoding error: {e}. Trying JSON fallback.")
            import json
            try:
                return json.loads(toon_str)
            except:
                return toon_str

    def estimate_token_savings(self, data: Any) -> Dict[str, Any]:
        """
        Estimate token savings using TOON vs JSON

        Args:
            data: Data to analyze

        Returns:
            Dictionary with size comparison and estimated savings
        """
        import json

        # JSON representation
        json_str = json.dumps(data, indent=2)
        json_chars = len(json_str)

        # TOON representation
        if self.enabled:
            try:
                toon_str = encode(data)
                toon_chars = len(toon_str)
            except:
                toon_str = json_str
                toon_chars = json_chars
        else:
            toon_str = json_str
            toon_chars = json_chars

        # Estimate tokens (rough: ~4 chars per token)
        json_tokens = json_chars // 4
        toon_tokens = toon_chars // 4

        savings_chars = json_chars - toon_chars
        savings_tokens = json_tokens - toon_tokens
        savings_percent = (savings_chars / json_chars * 100) if json_chars > 0 else 0

        return {
            "json_chars": json_chars,
            "toon_chars": toon_chars,
            "json_tokens_est": json_tokens,
            "toon_tokens_est": toon_tokens,
            "savings_chars": savings_chars,
            "savings_tokens_est": savings_tokens,
            "savings_percent": round(savings_percent, 2),
        }

    def encode_cv_data(self, cv_data: Dict[str, Any]) -> str:
        """
        Encode CV data with optimized TOON format

        Args:
            cv_data: CV text or extracted data

        Returns:
            TOON-encoded string
        """
        if isinstance(cv_data, str):
            # Plain text CV - return as-is
            return cv_data

        # Structured CV data - encode with TOON
        return self.encode_data(cv_data)

    def encode_jd_input(self, jd_input: Dict[str, Any]) -> str:
        """
        Encode JD builder input with TOON format

        Args:
            jd_input: JD form data

        Returns:
            TOON-encoded string

        Example:
            Input: {
                "job_title": "Senior Software Engineer",
                "department": "Engineering",
                "location": "Bangalore",
                "seniority_level": "Senior",
                "min_years_experience": 5,
                "max_years_experience": 8,
                "company_type": "Growth Startup"
            }

            TOON Output:
            job_title: Senior Software Engineer
            department: Engineering
            location: Bangalore
            seniority_level: Senior
            min_years_experience: 5
            max_years_experience: 8
            company_type: Growth Startup
        """
        return self.encode_data(jd_input)

    def encode_skills_array(self, skills: list) -> str:
        """
        Encode skills array with TOON tabular format

        Args:
            skills: List of skill objects

        Returns:
            TOON-encoded tabular format

        Example:
            Input: [
                {"skill": "Python", "proficiency": "expert", "years": 5},
                {"skill": "React", "proficiency": "advanced", "years": 3}
            ]

            TOON Output:
            [2,]{skill,proficiency,years}:
            Python,expert,5
            React,advanced,3
        """
        if not skills:
            return "[]"

        return self.encode_data(skills)

    def create_optimized_prompt(
        self,
        instruction: str,
        data: Any,
        output_format: str = "JSON",
    ) -> str:
        """
        Create optimized prompt with TOON-encoded data

        Args:
            instruction: Instruction for the LLM
            data: Data to encode with TOON
            output_format: Expected output format (JSON or TOON)

        Returns:
            Optimized prompt string
        """
        # Encode data with TOON
        encoded_data = self.encode_data(data)

        # Build prompt
        prompt_parts = [
            instruction.strip(),
            "",
            "INPUT DATA (TOON format):",
            encoded_data,
            "",
            f"Return ONLY valid {output_format}, no additional text.",
        ]

        return "\n".join(prompt_parts)


# Singleton instance
toon_service = TOONService()

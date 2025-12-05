"""
AWS Bedrock integration for Claude Sonnet model
Handles LLM calls with token tracking and cost calculation
"""

import json
import time
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.jd_builder import LLMCall, LLMCallType
import logging

logger = logging.getLogger(__name__)


# Token pricing for Claude models (per 1M tokens) - Updated for Claude Sonnet 4.5
TOKEN_PRICING = {
    "anthropic.claude-sonnet-4-20250514": {
        "input": 3.00,  # $3.00 per 1M input tokens
        "output": 15.00,  # $15.00 per 1M output tokens
    },
    "anthropic.claude-3-5-sonnet-20241022-v2:0": {
        "input": 3.00,
        "output": 15.00,
    },
    "anthropic.claude-3-5-sonnet-20240620-v1:0": {
        "input": 3.00,
        "output": 15.00,
    },
    "anthropic.claude-3-haiku-20240307-v1:0": {
        "input": 0.25,
        "output": 1.25,
    },
}


class BedrockService:
    """Service for interacting with AWS Bedrock and Claude models"""

    def __init__(self):
        self.client = boto3.client(
            service_name="bedrock-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self.default_model = "anthropic.claude-sonnet-4-20250514"

    def _calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> Dict[str, float]:
        """Calculate cost based on token usage"""
        pricing = TOKEN_PRICING.get(model_name, TOKEN_PRICING[self.default_model])

        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        total_cost = input_cost + output_cost

        return {
            "input_cost": round(input_cost, 6),
            "output_cost": round(output_cost, 6),
            "total_cost": round(total_cost, 6),
        }

    def _optimize_prompt(self, prompt: str) -> str:
        """
        Optimize prompt for token efficiency
        - Remove excessive whitespace
        - Compress repeated instructions
        """
        # Remove excessive whitespace
        lines = prompt.split('\n')
        optimized_lines = [line.strip() for line in lines if line.strip()]
        return '\n'.join(optimized_lines)

    async def invoke_claude(
        self,
        prompt: str,
        db: Session,
        user_id: str,
        call_type: LLMCallType,
        system_prompt: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        model_id: Optional[str] = None,
        job_description_id: Optional[str] = None,
        cv_id: Optional[str] = None,
        cv_parse_detail_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Invoke Claude model via Bedrock with token tracking

        Args:
            prompt: The user prompt
            db: Database session
            user_id: User ID for tracking
            call_type: Type of LLM call
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
            temperature: Temperature for generation
            model_id: Optional model ID (defaults to Claude Sonnet 4)
            job_description_id: Optional JD ID for tracking
            cv_id: Optional CV ID for tracking
            cv_parse_detail_id: Optional CV parse detail ID for tracking

        Returns:
            Dictionary with response, tokens, and cost
        """
        start_time = time.time()
        model_name = model_id or self.default_model

        # Optimize prompt for token efficiency
        optimized_prompt = self._optimize_prompt(prompt)

        try:
            # Prepare request body
            messages = [{"role": "user", "content": optimized_prompt}]

            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": messages,
            }

            if system_prompt:
                body["system"] = self._optimize_prompt(system_prompt)

            # Invoke Bedrock
            response = self.client.invoke_model(
                modelId=model_name,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json",
            )

            # Parse response
            response_body = json.loads(response["body"].read())

            # Extract token usage
            usage = response_body.get("usage", {})
            input_tokens = usage.get("input_tokens", 0)
            output_tokens = usage.get("output_tokens", 0)
            total_tokens = input_tokens + output_tokens

            # Calculate cost
            cost = self._calculate_cost(model_name, input_tokens, output_tokens)

            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)

            # Extract response text
            content = response_body.get("content", [])
            response_text = ""
            if content and len(content) > 0:
                response_text = content[0].get("text", "")

            # Track LLM call in database
            llm_call = LLMCall(
                user_id=user_id,
                job_description_id=job_description_id,
                cv_id=cv_id,
                cv_parse_detail_id=cv_parse_detail_id,
                call_type=call_type,
                model_name=model_name,
                provider="bedrock",
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                input_cost=cost["input_cost"],
                output_cost=cost["output_cost"],
                total_cost=cost["total_cost"],
                prompt_size_chars=len(optimized_prompt),
                response_size_chars=len(response_text),
                latency_ms=latency_ms,
                success=True,
            )
            db.add(llm_call)
            db.commit()
            db.refresh(llm_call)

            logger.info(
                f"LLM call successful: {call_type.value} | "
                f"Tokens: {input_tokens}/{output_tokens} | "
                f"Cost: ${cost['total_cost']:.6f} | "
                f"Latency: {latency_ms}ms"
            )

            return {
                "success": True,
                "response": response_text,
                "usage": {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": total_tokens,
                },
                "cost": cost,
                "latency_ms": latency_ms,
                "llm_call_id": str(llm_call.id),
            }

        except ClientError as e:
            error_message = str(e)
            logger.error(f"Bedrock API error: {error_message}")

            # Track failed call
            llm_call = LLMCall(
                user_id=user_id,
                job_description_id=job_description_id,
                cv_id=cv_id,
                cv_parse_detail_id=cv_parse_detail_id,
                call_type=call_type,
                model_name=model_name,
                provider="bedrock",
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                input_cost=0.0,
                output_cost=0.0,
                total_cost=0.0,
                prompt_size_chars=len(optimized_prompt),
                latency_ms=int((time.time() - start_time) * 1000),
                success=False,
                error_message=error_message,
            )
            db.add(llm_call)
            db.commit()

            return {
                "success": False,
                "error": error_message,
                "response": None,
            }

        except Exception as e:
            error_message = f"Unexpected error: {str(e)}"
            logger.error(error_message)

            # Track failed call
            llm_call = LLMCall(
                user_id=user_id,
                job_description_id=job_description_id,
                cv_id=cv_id,
                cv_parse_detail_id=cv_parse_detail_id,
                call_type=call_type,
                model_name=model_name,
                provider="bedrock",
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                input_cost=0.0,
                output_cost=0.0,
                total_cost=0.0,
                prompt_size_chars=len(optimized_prompt),
                latency_ms=int((time.time() - start_time) * 1000),
                success=False,
                error_message=error_message,
            )
            db.add(llm_call)
            db.commit()

            return {
                "success": False,
                "error": error_message,
                "response": None,
            }


# Singleton instance
bedrock_service = BedrockService()

"""
OpenAI integration for GPT models
Handles LLM calls with token tracking and cost calculation
"""

import json
import time
from typing import Dict, Any, Optional
from openai import AsyncOpenAI, OpenAIError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.jd_builder import LLMCall, LLMCallType
import logging

logger = logging.getLogger(__name__)


# Token pricing for OpenAI models (per 1M tokens)
# As of Dec 2024
TOKEN_PRICING = {
    "gpt-4o": {
        "input": 5.00,
        "output": 15.00,
    },
    "gpt-4o-mini": {
        "input": 0.15,
        "output": 0.60,
    },
    "gpt-4-turbo": {
        "input": 10.00,
        "output": 30.00,
    },
}


class OpenAIService:
    """Service for interacting with OpenAI models"""

    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.default_model = "gpt-4o"

    def _calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> Dict[str, float]:
        """Calculate cost based on token usage"""
        # Default to gpt-4o pricing if model not found
        pricing = TOKEN_PRICING.get(model_name, TOKEN_PRICING["gpt-4o"])

        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        total_cost = input_cost + output_cost

        return {
            "input_cost": round(input_cost, 6),
            "output_cost": round(output_cost, 6),
            "total_cost": round(total_cost, 6),
        }

    async def invoke_model(
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
        use_toon: bool = True, # Kept for interface compatibility, though TOON is less critical for OpenAI
    ) -> Dict[str, Any]:
        """
        Invoke OpenAI model with token tracking
        """
        if not self.client:
            return {
                "success": False,
                "error": "OpenAI API key not configured",
            }

        start_time = time.time()
        model_name = model_id or self.default_model

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})

            # Invoke OpenAI
            response = await self.client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            # Extract response
            response_text = response.choices[0].message.content
            
            # Extract token usage
            usage = response.usage
            input_tokens = usage.prompt_tokens
            output_tokens = usage.completion_tokens
            total_tokens = usage.total_tokens

            # Calculate cost
            cost = self._calculate_cost(model_name, input_tokens, output_tokens)

            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)

            # Track LLM call in database
            llm_call = LLMCall(
                user_id=user_id,
                job_description_id=job_description_id,
                cv_id=cv_id,
                cv_parse_detail_id=cv_parse_detail_id,
                call_type=call_type,
                model_name=model_name,
                provider="openai",
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                input_cost=cost["input_cost"],
                output_cost=cost["output_cost"],
                total_cost=cost["total_cost"],
                prompt_size_chars=len(prompt),
                response_size_chars=len(response_text),
                latency_ms=latency_ms,
                success=True,
            )
            db.add(llm_call)
            db.commit()
            db.refresh(llm_call)

            logger.info(
                f"OpenAI call successful: {call_type.value} | "
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

        except OpenAIError as e:
            error_message = str(e)
            logger.error(f"OpenAI API error: {error_message}")

            # Track failed call
            llm_call = LLMCall(
                user_id=user_id,
                job_description_id=job_description_id,
                cv_id=cv_id,
                cv_parse_detail_id=cv_parse_detail_id,
                call_type=call_type,
                model_name=model_name,
                provider="openai",
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                input_cost=0.0,
                output_cost=0.0,
                total_cost=0.0,
                prompt_size_chars=len(prompt),
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
                provider="openai",
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                input_cost=0.0,
                output_cost=0.0,
                total_cost=0.0,
                prompt_size_chars=len(prompt),
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
openai_service = OpenAIService()

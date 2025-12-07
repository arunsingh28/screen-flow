"""
LLM Factory to switch between providers
"""

from typing import Any
from app.core.config import settings
from app.services.bedrock import bedrock_service
from app.services.openai_service import openai_service

import logging

logger = logging.getLogger(__name__)

class LLMFactory:
    @staticmethod
    def get_service() -> Any:
        """
        Get the configured LLM service instance
        """
        provider = settings.LLM_PROVIDER.lower()
        
        logger.info(f"Using LLM Provider: {provider}")
        
        if provider == "openai":
            return openai_service
        elif provider == "bedrock":
            return bedrock_service
        else:
            # Default to bedrock if unknown
            logger.warning(f"Unknown LLM provider '{provider}', defaulting to Bedrock")
            return bedrock_service

llm_factory = LLMFactory()

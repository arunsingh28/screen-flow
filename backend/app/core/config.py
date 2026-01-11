from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "ScreenFlow API"

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # Security
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://app.xowix.com",
        "https://www.xowix.com",
    ]

    # Environment
    ENVIRONMENT: str = "development"

    # AWS S3
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str
    S3_PRESIGNED_URL_EXPIRATION: int = 3600  # 1 hour

    # LLM Configuration
    LLM_PROVIDER: str = "bedrock"  # Options: "bedrock", "openai"
    OPENAI_API_KEY: Optional[str] = None
    
    # CV Scoring Configuration
    CV_SCORING_METHOD: str = "default"  # Options: "default", "langchain"
    OPENAI_MODEL: str = "gpt-4o-mini"  # Model for LangChain scoring

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

#!/usr/bin/env python3
"""
CV Processing Verification Script
Run this to verify your CV processing setup
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("   ScreenFlow CV Processing - Verification Script")
print("=" * 60)
print()

errors = []
warnings = []
success = []

# 1. Check environment variables
print("1. Checking Environment Variables...")
print("-" * 60)

llm_provider = os.getenv("LLM_PROVIDER", "").lower()
openai_key = os.getenv("OPENAI_API_KEY", "")
redis_url = os.getenv("REDIS_URL", "")
database_url = os.getenv("DATABASE_URL", "")

if llm_provider == "openai":
    success.append("✓ LLM_PROVIDER set to 'openai'")
    print(f"  ✓ LLM_PROVIDER: {llm_provider}")
elif llm_provider == "bedrock":
    warnings.append("⚠ LLM_PROVIDER set to 'bedrock' (should be 'openai' if using OpenAI)")
    print(f"  ⚠ LLM_PROVIDER: {llm_provider}")
else:
    errors.append("✗ LLM_PROVIDER not set or invalid")
    print(f"  ✗ LLM_PROVIDER: Not set or invalid")

if openai_key and openai_key.startswith("sk-"):
    success.append("✓ OPENAI_API_KEY configured")
    print(f"  ✓ OPENAI_API_KEY: {openai_key[:10]}...{openai_key[-4:]}")
else:
    errors.append("✗ OPENAI_API_KEY not configured properly")
    print(f"  ✗ OPENAI_API_KEY: Not set or invalid")

if redis_url:
    success.append("✓ REDIS_URL configured")
    print(f"  ✓ REDIS_URL: {redis_url}")
else:
    errors.append("✗ REDIS_URL not configured")
    print(f"  ✗ REDIS_URL: Not set")

if database_url:
    success.append("✓ DATABASE_URL configured")
    print(f"  ✓ DATABASE_URL: {database_url.split('@')[0]}@...")
else:
    errors.append("✗ DATABASE_URL not configured")
    print(f"  ✗ DATABASE_URL: Not set")

print()

# 2. Check Redis connection
print("2. Checking Redis Connection...")
print("-" * 60)

try:
    import redis
    r = redis.from_url(redis_url)
    r.ping()
    success.append("✓ Redis connection successful")
    print("  ✓ Redis is running and accessible")
except Exception as e:
    errors.append(f"✗ Redis connection failed: {e}")
    print(f"  ✗ Redis connection failed: {e}")

print()

# 3. Check Database connection
print("3. Checking Database Connection...")
print("-" * 60)

try:
    from sqlalchemy import create_engine, text
    engine = create_engine(database_url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        result.fetchone()
    success.append("✓ Database connection successful")
    print("  ✓ Database is running and accessible")
except Exception as e:
    errors.append(f"✗ Database connection failed: {e}")
    print(f"  ✗ Database connection failed: {e}")

print()

# 4. Check LLM Service
print("4. Checking LLM Service...")
print("-" * 60)

try:
    from app.services.llm_factory import llm_factory
    service = llm_factory.get_service()

    if llm_provider == "openai":
        from app.services.openai_service import openai_service
        if openai_service.client:
            success.append("✓ OpenAI service initialized")
            print("  ✓ OpenAI service initialized successfully")
        else:
            errors.append("✗ OpenAI service client not initialized")
            print("  ✗ OpenAI service client not initialized (check API key)")
    elif llm_provider == "bedrock":
        success.append("✓ Bedrock service loaded")
        print("  ✓ Bedrock service loaded")
except Exception as e:
    errors.append(f"✗ LLM service initialization failed: {e}")
    print(f"  ✗ LLM service initialization failed: {e}")

print()

# 5. Check Celery
print("5. Checking Celery Configuration...")
print("-" * 60)

try:
    from app.core.celery_config import celery_app
    success.append("✓ Celery configuration loaded")
    print("  ✓ Celery configuration loaded")
    print(f"  ℹ Broker: {celery_app.conf.broker_url}")
    print(f"  ℹ Backend: {celery_app.conf.result_backend}")
except Exception as e:
    errors.append(f"✗ Celery configuration failed: {e}")
    print(f"  ✗ Celery configuration failed: {e}")

print()

# 6. Check Database Tables
print("6. Checking Database Tables...")
print("-" * 60)

try:
    from sqlalchemy import create_engine, inspect
    engine = create_engine(database_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    required_tables = ['cvs', 'cv_batches', 'cv_parse_details', 'llm_calls', 'job_descriptions']
    missing_tables = [t for t in required_tables if t not in tables]

    if missing_tables:
        errors.append(f"✗ Missing tables: {', '.join(missing_tables)}")
        print(f"  ✗ Missing tables: {', '.join(missing_tables)}")
        print("  ℹ Run: alembic upgrade head")
    else:
        success.append("✓ All required tables exist")
        print("  ✓ All required tables exist")

    print(f"  ℹ Total tables: {len(tables)}")
except Exception as e:
    errors.append(f"✗ Database inspection failed: {e}")
    print(f"  ✗ Database inspection failed: {e}")

print()

# 7. Check CV Processing
print("7. Checking CV Processing Setup...")
print("-" * 60)

try:
    from app.services.cv_parser import cv_parser_service
    success.append("✓ CV Parser service loaded")
    print("  ✓ CV Parser service loaded")
except Exception as e:
    errors.append(f"✗ CV Parser service failed: {e}")
    print(f"  ✗ CV Parser service failed: {e}")

try:
    from app.tasks.cv_tasks import process_cv_task
    success.append("✓ CV processing task registered")
    print("  ✓ CV processing task registered")
except Exception as e:
    errors.append(f"✗ CV processing task failed: {e}")
    print(f"  ✗ CV processing task failed: {e}")

print()

# Summary
print("=" * 60)
print("   Summary")
print("=" * 60)
print()

if success:
    print("✓ Successful Checks:")
    for s in success:
        print(f"  {s}")
    print()

if warnings:
    print("⚠ Warnings:")
    for w in warnings:
        print(f"  {w}")
    print()

if errors:
    print("✗ Errors:")
    for e in errors:
        print(f"  {e}")
    print()
    print("Please fix the errors above before processing CVs.")
    print("See CV_PROCESSING_TROUBLESHOOTING.md for help.")
    sys.exit(1)
else:
    print("=" * 60)
    print("✓ All checks passed! CV processing is ready.")
    print("=" * 60)
    print()
    print("To start processing:")
    print("  1. Make sure Celery worker is running:")
    print("     celery -A app.core.celery_config.celery_app worker --loglevel=info")
    print()
    print("  2. Upload CVs and trigger processing via API:")
    print("     POST /api/v1/cv-processing/batch/{batch_id}/process")
    print()
    print("  3. Monitor queue status:")
    print("     GET /api/v1/cv-processing/batch/{batch_id}/queue-status")
    print()
    sys.exit(0)

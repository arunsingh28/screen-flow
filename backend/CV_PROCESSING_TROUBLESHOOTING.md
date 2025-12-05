# CV Processing Troubleshooting Guide

## Issue: CVs Not Processing / Status Not Changing

This guide will help you debug and fix CV processing issues.

## Quick Diagnosis Checklist

### 1. Check LLM Provider Configuration

**Problem**: If you're using OpenAI but LLM_PROVIDER is set to "bedrock", it will fail.

**Fix**:
```bash
# Edit backend/.env file
LLM_PROVIDER=openai  # Change from "bedrock" to "openai"
OPENAI_API_KEY=sk-your-actual-key-here
```

### 2. Check if Celery Worker is Running

**Problem**: CVs won't process without a Celery worker running.

**Check**:
```bash
# Are there any celery processes?
ps aux | grep celery
```

**Fix - Start Celery Worker**:
```bash
cd backend

# Option 1: Start with docker-compose
docker-compose -f docker-compose.dev.yml up celery

# Option 2: Start manually
celery -A app.core.celery_config.celery_app worker --loglevel=info
```

### 3. Check Redis Connection

**Problem**: Celery needs Redis for the queue.

**Check**:
```bash
# Is Redis running?
redis-cli ping
# Should return: PONG

# Or check with docker:
docker ps | grep redis
```

**Fix**:
```bash
# Start Redis with docker-compose
docker-compose -f docker-compose.dev.yml up redis
```

### 4. Check Database Migration

**Problem**: New tables might not exist.

**Check & Fix**:
```bash
cd backend

# Run migration
alembic upgrade head

# Or with docker:
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head
```

---

## Detailed Debugging Steps

### Step 1: Verify Environment Variables

```bash
cd backend

# Check if .env file exists
cat .env | grep LLM_PROVIDER
cat .env | grep OPENAI_API_KEY
```

**Expected output**:
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
```

**If missing or wrong, update .env**:
```bash
# Edit .env file
nano .env

# Add/update these lines:
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

### Step 2: Test OpenAI Connection

Create a test script:

```bash
cd backend

# Create test file
cat > test_openai.py << 'EOF'
import os
from dotenv import load_dotenv
load_dotenv()

from app.services.openai_service import openai_service

print(f"OpenAI Client: {openai_service.client}")
print(f"API Key configured: {bool(os.getenv('OPENAI_API_KEY'))}")
print(f"LLM Provider: {os.getenv('LLM_PROVIDER')}")

# Test simple call
import asyncio

async def test():
    from app.database import SessionLocal
    db = SessionLocal()

    result = await openai_service.invoke_model(
        prompt="Say hello",
        db=db,
        user_id="test",
        call_type="cv_parsing",
        max_tokens=50
    )

    print(f"Result: {result}")
    db.close()

asyncio.run(test())
EOF

# Run test
python test_openai.py
```

**Expected**: Should print a response from OpenAI without errors.

### Step 3: Check CV Status in Database

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U screenflow -d screenflow_db

# Or if running locally:
psql postgresql://screenflow:screenflow_dev_password@localhost:5432/screenflow_db

# Check CV statuses
SELECT id, filename, status, error_message, created_at
FROM cvs
ORDER BY created_at DESC
LIMIT 10;

# Check if any are QUEUED
SELECT COUNT(*) FROM cvs WHERE status = 'queued';

# Exit
\q
```

### Step 4: Check Celery Logs

```bash
# If running with docker-compose
docker-compose -f docker-compose.dev.yml logs celery -f

# Look for errors like:
# - "Connection refused" (Redis not running)
# - "OpenAI API key not configured"
# - "Failed to parse CV"
# - Any Python exceptions
```

### Step 5: Manually Trigger CV Processing

Test the endpoint directly:

```bash
# Get your auth token first (login)
TOKEN="your-jwt-token-here"

# Get batch ID (from database or API)
BATCH_ID="your-batch-uuid"

# Trigger processing
curl -X POST "http://localhost:8000/api/v1/cv-processing/batch/${BATCH_ID}/process" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

**Expected response**:
```json
{
  "success": true,
  "message": "Queued N CVs for processing",
  "batch_id": "...",
  "total_cvs": N,
  "task_ids": ["task-id-1", "task-id-2"]
}
```

### Step 6: Check Queue Status

```bash
# Check queue status
curl -X GET "http://localhost:8000/api/v1/cv-processing/batch/${BATCH_ID}/queue-status" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected response**:
```json
{
  "batch_id": "...",
  "total_cvs": 10,
  "queued": 5,
  "processing": 1,
  "completed": 3,
  "failed": 1,
  "percentage": 40.0,
  "estimated_time_seconds": 180
}
```

---

## Common Errors and Fixes

### Error: "OpenAI API key not configured"

**Cause**: OPENAI_API_KEY not set in .env

**Fix**:
```bash
# Add to backend/.env
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Restart backend
```

### Error: "Connection refused" (Celery)

**Cause**: Redis not running

**Fix**:
```bash
# Start Redis
docker-compose -f docker-compose.dev.yml up redis -d

# Or start all services
docker-compose -f docker-compose.dev.yml up -d
```

### Error: CVs stuck in QUEUED status

**Cause**: Celery worker not running

**Fix**:
```bash
# Start Celery worker
cd backend
celery -A app.core.celery_config.celery_app worker --loglevel=info

# Or with docker:
docker-compose -f docker-compose.dev.yml up celery
```

### Error: "No CVs to process"

**Cause**: No CVs with status=QUEUED in batch

**Fix**:
```bash
# Check CV statuses
psql -U screenflow -d screenflow_db -c "SELECT status, COUNT(*) FROM cvs GROUP BY status;"

# If all are COMPLETED or FAILED, upload new CVs
# If stuck in PROCESSING, reset them:
psql -U screenflow -d screenflow_db -c "UPDATE cvs SET status = 'queued' WHERE status = 'processing';"
```

### Error: "Table does not exist"

**Cause**: Migration not run

**Fix**:
```bash
cd backend
alembic upgrade head
```

---

## Complete Restart Process

If all else fails, restart everything:

```bash
# 1. Stop all services
docker-compose -f docker-compose.dev.yml down

# 2. Remove volumes (optional - will delete data!)
docker-compose -f docker-compose.dev.yml down -v

# 3. Check .env configuration
cat backend/.env | grep -E "LLM_PROVIDER|OPENAI_API_KEY"

# 4. Start services
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 5. Run migrations
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head

# 6. Start backend
docker-compose -f docker-compose.dev.yml up backend

# 7. Start Celery (in new terminal)
docker-compose -f docker-compose.dev.yml up celery
```

---

## Monitoring CV Processing

### Watch Celery Logs in Real-Time

```bash
# Terminal 1: Celery logs
docker-compose -f docker-compose.dev.yml logs celery -f

# Terminal 2: Backend logs
docker-compose -f docker-compose.dev.yml logs backend -f

# Terminal 3: Monitor database
watch -n 2 'docker-compose -f docker-compose.dev.yml exec postgres psql -U screenflow -d screenflow_db -c "SELECT status, COUNT(*) FROM cvs GROUP BY status;"'
```

### Check Individual CV Status

```python
# In Python shell
from app.database import SessionLocal
from app.models.job import CV

db = SessionLocal()

# Get a specific CV
cv = db.query(CV).filter(CV.id == "your-cv-uuid").first()

print(f"Status: {cv.status}")
print(f"Error: {cv.error_message}")
print(f"Parsed text length: {len(cv.parsed_text) if cv.parsed_text else 0}")

db.close()
```

---

## Verification Checklist

After fixes, verify:

- [ ] Redis is running: `redis-cli ping` returns `PONG`
- [ ] Database is accessible: `psql` connects successfully
- [ ] Migrations are current: `alembic current` shows latest
- [ ] Environment vars set: `echo $LLM_PROVIDER` shows `openai`
- [ ] OpenAI key valid: Test with simple API call
- [ ] Celery worker running: `ps aux | grep celery` shows process
- [ ] Backend API running: `curl http://localhost:8000/health` returns `{"status":"healthy"}`
- [ ] CVs in QUEUED status: Database query shows CVs ready to process
- [ ] Processing endpoint works: POST request returns success
- [ ] CV status changes: Watch logs/database for status transitions

---

## Still Not Working?

### Check Application Logs

```bash
# Backend application logs
tail -f backend/logs/app.log

# Or if using docker:
docker-compose -f docker-compose.dev.yml logs backend --tail=100 -f
```

### Enable Debug Mode

```bash
# In backend/.env
DEBUG=true

# Restart backend to see more detailed logs
```

### Test Individual Components

```python
# Test CV parser directly
from app.services.cv_parser import cv_parser_service
from app.database import SessionLocal
from app.models.job import CV
import asyncio

db = SessionLocal()

# Get a CV
cv = db.query(CV).filter(CV.status == "queued").first()

# Download file from S3
from app.services.s3_service import s3_service
file_content = s3_service.download_file(cv.s3_key)

# Parse it
result = asyncio.run(
    cv_parser_service.parse_cv(cv, file_content, db, str(cv.user_id))
)

print(f"Result: {result}")
db.close()
```

---

## Need More Help?

1. Check full logs: `docker-compose -f docker-compose.dev.yml logs --tail=500`
2. Check celery worker is picking up tasks: Look for "Received task" in celery logs
3. Verify OpenAI API quota: Check OpenAI dashboard for API usage/errors
4. Test with a single small CV first before batch processing

---

**Last Updated**: December 5, 2025

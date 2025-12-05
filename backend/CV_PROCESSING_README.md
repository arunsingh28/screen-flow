# CV Processing with AWS Bedrock - Implementation Guide

This document provides a comprehensive guide for the CV processing system built with AWS Bedrock Claude Sonnet model, JD Builder, and queue-based CV parsing.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [API Endpoints](#api-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Cost Tracking](#cost-tracking)
7. [Queue System](#queue-system)
8. [GitHub Integration](#github-integration)

---

## Features

### ✅ Implemented Features

1. **JD Builder**
   - Generate structured job descriptions from form inputs
   - Upload and parse existing JDs
   - Extract missing fields and ask users to fill them
   - Real-time JD generation with WebSocket updates
   - Token-optimized prompts to minimize costs

2. **CV Parsing**
   - Queue-based CV processing (process multiple CVs sequentially)
   - Extract structured data with skill recency tracking
   - Parse PDF and DOCX files
   - Calculate CV quality scores
   - Detect red flags (job hopping, gaps, outdated skills)
   - Real-time progress updates via WebSocket

3. **GitHub Profile Analysis**
   - Fetch GitHub profile data
   - Validate CV claims against GitHub activity
   - Assess code quality and contributions
   - Identify green/red flags

4. **LLM Call Tracking**
   - Track all LLM API calls
   - Monitor token usage (input/output)
   - Calculate costs per call
   - Track latency and errors
   - Generate usage statistics by call type

---

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ HTTP + WebSocket
         ▼
┌─────────────────┐
│   FastAPI       │
│   Backend       │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    ▼         ▼            ▼            ▼
┌────────┐ ┌──────┐  ┌─────────┐  ┌─────────┐
│  AWS   │ │Redis │  │PostgreSQL│  │ Celery │
│Bedrock │ │Cache │  │    DB    │  │ Worker │
└────────┘ └──────┘  └─────────┘  └─────────┘
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# AWS Bedrock (already have AWS credentials)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# GitHub API (optional, for GitHub analysis)
GITHUB_TOKEN=your-github-personal-access-token
```

### 3. Run Database Migration

```bash
cd backend
alembic upgrade head
```

This will create the new tables:
- `job_descriptions` - Store JDs
- `llm_calls` - Track all LLM API calls
- `cv_parse_details` - Store parsed CV data
- `github_analyses` - Store GitHub profile analyses

### 4. Start Celery Worker (for CV queue processing)

```bash
cd backend
celery -A app.core.celery_config.celery_app worker --loglevel=info
```

### 5. Start Backend Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

---

## API Endpoints

### JD Builder Endpoints

#### 1. Build JD from Form
```http
POST /api/v1/jd-builder/build
Content-Type: application/json
Authorization: Bearer <token>

{
  "job_title": "Senior Software Engineer",
  "department": "Engineering",
  "employment_type": "Full-time",
  "location": "Bangalore",
  "seniority_level": "Senior",
  "min_years_experience": 5,
  "max_years_experience": 8,
  "company_type": "Growth Startup",
  "industry": "FinTech",
  "prior_roles": "SDE, Backend Engineer"
}
```

**Response:**
```json
{
  "success": true,
  "jd_id": "uuid",
  "structured_jd": {
    "must_have_skills": [...],
    "nice_to_have_skills": [...],
    "key_responsibilities": [...],
    "education": {...},
    "compensation": {...}
  },
  "usage": {
    "input_tokens": 1234,
    "output_tokens": 2345,
    "total_tokens": 3579
  },
  "cost": {
    "input_cost": 0.003702,
    "output_cost": 0.035175,
    "total_cost": 0.038877
  }
}
```

#### 2. Upload Existing JD
```http
POST /api/v1/jd-builder/upload
Content-Type: application/json
Authorization: Bearer <token>

{
  "jd_text": "We're hiring a Senior Full-Stack Engineer..."
}
```

**Response:**
```json
{
  "success": true,
  "jd_id": "uuid",
  "structured_jd": {...},
  "extraction_status": "partial",
  "missing_fields": [
    {
      "field": "company_type",
      "criticality": "important",
      "question_to_ask_user": "What type of company is this?",
      "why_needed": "Helps calibrate expectations..."
    }
  ]
}
```

#### 3. Refine JD with Missing Fields
```http
POST /api/v1/jd-builder/refine
Content-Type: application/json
Authorization: Bearer <token>

{
  "jd_id": "uuid",
  "provided_fields": {
    "company_type": "Growth Startup",
    "industry": "SaaS"
  }
}
```

#### 4. List User's JDs
```http
GET /api/v1/jd-builder/list?skip=0&limit=10
Authorization: Bearer <token>
```

#### 5. Get JD Details
```http
GET /api/v1/jd-builder/{jd_id}
Authorization: Bearer <token>
```

#### 6. Get LLM Usage Statistics
```http
GET /api/v1/jd-builder/llm/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_calls": 150,
  "total_tokens": 500000,
  "total_cost": 15.50,
  "by_call_type": {
    "jd_generation": {
      "count": 50,
      "total_tokens": 200000,
      "total_cost": 6.00
    },
    "cv_parsing": {
      "count": 100,
      "total_tokens": 300000,
      "total_cost": 9.50
    }
  },
  "recent_calls": [...]
}
```

### CV Processing Endpoints

#### 1. Process Batch CVs (Start Queue)
```http
POST /api/v1/cv-processing/batch/{batch_id}/process
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Queued 10 CVs for processing",
  "batch_id": "uuid",
  "total_cvs": 10,
  "task_ids": ["task-1", "task-2", ...]
}
```

#### 2. Get Queue Status
```http
GET /api/v1/cv-processing/batch/{batch_id}/queue-status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "batch_id": "uuid",
  "total_cvs": 10,
  "queued": 5,
  "processing": 1,
  "completed": 3,
  "failed": 1,
  "percentage": 40.0,
  "estimated_time_seconds": 180,
  "estimated_time_minutes": 3.0
}
```

#### 3. Get CV Parse Details
```http
GET /api/v1/cv-processing/cv/{cv_id}/parse-details
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "cv_id": "uuid",
  "candidate_name": "John Doe",
  "candidate_email": "john@example.com",
  "current_role": "Senior Engineer",
  "current_company": "TechCorp",
  "total_experience_years": 6.5,
  "career_level": "senior",
  "current_skills_count": 15,
  "outdated_skills_count": 3,
  "github_username": "johndoe",
  "cv_quality_score": 85,
  "parsing_confidence": "high",
  "red_flags_count": 1,
  "parsed_data": {
    "personal_info": {...},
    "work_experience": [...],
    "skills": {...},
    "education": [...]
  }
}
```

#### 4. Get Batch Parsed CVs
```http
GET /api/v1/cv-processing/batch/{batch_id}/parsed-cvs?skip=0&limit=50
Authorization: Bearer <token>
```

---

## WebSocket Events

### Connect to WebSocket

#### JD Builder WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/jd-builder/ws/{user_id}');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'jd_progress') {
    console.log(`JD ${data.jd_id}: ${data.progress}% - ${data.status}`);
  }

  if (data.type === 'jd_suggestion') {
    console.log(`New suggestion: ${data.suggestion_type}`, data.data);
  }
};
```

#### CV Processing WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/cv-processing/ws/{user_id}');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'cv_progress') {
    console.log(`CV ${data.cv_id}: ${data.progress}% - ${data.status}`);
  }

  if (data.type === 'batch_progress') {
    console.log(`Batch progress:`, data);
    // data contains: total_cvs, queued, processing, completed, failed, percentage
  }
};
```

### Event Types

#### JD Builder Events
- `jd_progress`: JD generation progress
- `jd_suggestion`: Real-time suggestions during JD building

#### CV Processing Events
- `cv_progress`: Individual CV processing progress
- `batch_progress`: Batch queue status updates

---

## Cost Tracking

### Token Pricing (Claude Sonnet 4.5)

- **Input tokens**: $3.00 per 1M tokens
- **Output tokens**: $15.00 per 1M tokens

### Example Costs

| Operation | Input Tokens | Output Tokens | Cost |
|-----------|--------------|---------------|------|
| JD Generation | 800 | 2000 | $0.0324 |
| JD Parsing | 1500 | 2500 | $0.042 |
| CV Parsing | 2000 | 3000 | $0.051 |
| GitHub Analysis | 1800 | 2500 | $0.0429 |

### Optimization Techniques

The system uses several techniques to minimize token usage:

1. **Prompt Optimization**: Remove excessive whitespace and redundancy
2. **Structured Outputs**: Use JSON for efficient data transfer
3. **Targeted Prompts**: Only request necessary information
4. **Temperature Control**: Lower temperature (0.3) for parsing tasks
5. **Token Caching**: (Future) Cache common prompt patterns

### Monitoring Costs

Use the LLM stats endpoint to monitor your usage:

```bash
curl -X GET "http://localhost:8000/api/v1/jd-builder/llm/stats" \
  -H "Authorization: Bearer <token>"
```

---

## Queue System

### How It Works

1. **Upload CVs**: User uploads multiple CVs to a batch
2. **Queue**: CVs are added to Celery queue with status `QUEUED`
3. **Processing**: Celery worker processes CVs one by one
4. **Progress**: WebSocket sends real-time updates
5. **Completion**: CV status changes to `COMPLETED` or `FAILED`

### Queue Configuration

- **Worker Prefetch**: 1 (process one CV at a time)
- **Task Timeout**: 10 minutes per CV
- **Retry Policy**: No automatic retry (user can re-trigger)
- **Estimated Time**: ~30 seconds per CV

### Monitoring Queue

```python
from app.tasks.cv_tasks import get_queue_status

queue_status = get_queue_status(batch_id)
print(queue_status)
```

---

## GitHub Integration

### Setup

1. Create a GitHub Personal Access Token:
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `read:user`, `public_repo`
   - Copy token to `.env` as `GITHUB_TOKEN`

2. The system will automatically:
   - Extract GitHub username from CV
   - Fetch profile and repository data
   - Analyze code quality and contributions
   - Validate CV claims

### GitHub Analysis Features

- Profile data (followers, repos, activity)
- Top repositories by stars
- Language usage statistics
- Recent activity (last 6 months)
- Code quality assessment
- Skill validation against CV
- Green/red flags detection

---

## Testing

### Test JD Builder

```bash
# Build JD
curl -X POST "http://localhost:8000/api/v1/jd-builder/build" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Senior Software Engineer",
    "department": "Engineering",
    "location": "Bangalore",
    "seniority_level": "Senior",
    "min_years_experience": 5,
    "max_years_experience": 8,
    "company_type": "Growth Startup"
  }'
```

### Test CV Processing

```bash
# Start processing batch
curl -X POST "http://localhost:8000/api/v1/cv-processing/batch/{batch_id}/process" \
  -H "Authorization: Bearer <token>"

# Check queue status
curl -X GET "http://localhost:8000/api/v1/cv-processing/batch/{batch_id}/queue-status" \
  -H "Authorization: Bearer <token>"
```

---

## Troubleshooting

### Common Issues

1. **Celery worker not starting**
   - Check Redis connection: `redis-cli ping`
   - Verify `REDIS_URL` in `.env`

2. **AWS Bedrock errors**
   - Verify AWS credentials and region
   - Check IAM permissions for Bedrock access
   - Ensure model `anthropic.claude-sonnet-4-20250514` is enabled

3. **WebSocket connection fails**
   - Check CORS settings in `config.py`
   - Verify user_id in WebSocket URL

4. **High costs**
   - Review LLM stats endpoint
   - Check for unnecessary API calls
   - Optimize prompts further

### Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Celery worker logs
celery -A app.core.celery_config.celery_app worker --loglevel=debug
```

---

## Performance Tips

1. **Batch Processing**: Process CVs in batches to utilize queue efficiently
2. **Caching**: Use Redis to cache frequently accessed data
3. **Async Operations**: Use `async/await` for I/O-bound operations
4. **Database Indexing**: Ensure proper indexes on frequently queried fields
5. **Rate Limiting**: Implement rate limits to prevent abuse

---

## Future Enhancements

- [ ] Streaming LLM responses for better UX
- [ ] Prompt caching to reduce costs
- [ ] Multi-language CV support
- [ ] Advanced skill matching algorithms
- [ ] Resume builder/editor
- [ ] Interview question generator based on JD/CV
- [ ] Candidate ranking and scoring
- [ ] Email notifications for queue completion
- [ ] Dashboard with analytics and insights

---

## Support

For issues or questions:
- Check the logs first
- Review this documentation
- Contact: support@screenflow.com

---

## License

Proprietary - ScreenFlow © 2025

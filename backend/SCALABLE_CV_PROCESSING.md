# Scalable CV Processing Architecture

## Overview

The CV processing system has been redesigned for scalability, allowing independent processing of CVs from multiple accounts with intelligent Job Description (JD) matching and real-time progress tracking.

## Architecture Principles

### 1. Independent Processing
- **Account-Agnostic Workers**: Celery workers can process CVs from any account
- **JD Fetching**: Workers fetch the JD from the batch's `job_description_id` at runtime
- **Horizontal Scalability**: Add more worker nodes to handle increased load
- **Multi-Tenant**: Process CVs from multiple accounts simultaneously without conflicts

### 2. Data Model

```
User (Account)
  ├── JobDescription (Created via JD Builder)
  └── CVBatch (Job/Recruitment Drive)
      ├── job_description_id → JobDescription (Optional link)
      └── CVs[]
          ├── parsed_data (from CV Parser)
          ├── jd_match_score (0-100)
          └── jd_match_data (detailed analysis)
```

**Key Relationships:**
- `CVBatch.job_description_id` → `JobDescription.id` (Optional)
- Worker fetches JD from batch, enabling independent processing
- Each CV stores its own match score and analysis

## Processing Flow

### Stage-by-Stage Processing

```
1. QUEUED (0%) → Waiting in queue
2. DOWNLOADING (10%) → Downloading CV from S3/storage
3. EXTRACTING (20%) → Extracting text from PDF/DOCX
4. ANALYZING_STRUCTURE (30%) → Analyzing CV structure
5. PARSING_WITH_AI (50%) → Parsing CV with AI
6. MATCHING_JD (70%) → Matching against job requirements*
7. ANALYZING_GITHUB (80%) → Analyzing GitHub profile*
8. FINALIZING (90%) → Finalizing results
9. COMPLETED (100%) → Processing completed

* Only if applicable (JD exists, GitHub username found)
```

### Processing Task Flow

```python
def process_cv_task(cv_id, user_id):
    # 1. Fetch CV and Batch
    cv = db.query(CV).filter(CV.id == cv_id).first()
    batch = db.query(CVBatch).filter(CVBatch.id == cv.batch_id).first()

    # 2. Fetch JD from batch (if available)
    job_description = None
    if batch.job_description_id:
        job_description = db.query(JobDescription).filter(
            JobDescription.id == batch.job_description_id
        ).first()

    # 3. Download and parse CV
    file_content = s3_service.download_file(cv.s3_key)
    result = cv_parser_service.parse_cv(cv, file_content, db, user_id)

    # 4. Match against JD (if available)
    if job_description:
        match_result = cv_jd_matcher_service.match_cv_to_jd(
            cv_parsed_data=result['parsed_data'],
            job_description=job_description,
            db=db,
            user_id=user_id,
            cv_id=cv_id
        )
        cv.jd_match_score = match_result['match_score']
        cv.jd_match_data = match_result['match_data']

    # 5. Finalize
    cv.status = CVStatus.COMPLETED
    return result
```

## Features

### 1. Intelligent CV-JD Matching

The `cv_jd_matcher_service` compares parsed CVs against Job Descriptions using LLM:

**Match Dimensions:**
- Technical Skills Match (0-100)
- Experience Match (0-100)
- Education Match (0-100)
- Soft Skills Match (0-100)
- Culture Fit Indicators
- Overall Match Score (0-100)

**Output Includes:**
- Required skills matched vs missing
- Experience assessment (exceeds/meets/below)
- Red flags and concerns
- Strengths and standout points
- Interview focus areas
- Recommendation (strong-yes/yes/maybe/no/strong-no)

**Example Match Data:**
```json
{
  "overall_match_score": 85,
  "match_summary": "Strong candidate with 5+ years relevant experience...",
  "technical_skills_match": {
    "score": 88,
    "required_skills_matched": [
      {
        "skill": "Python",
        "proficiency_level": "expert",
        "years_experience": 6,
        "last_used": "Present",
        "match_quality": "exact"
      }
    ],
    "required_skills_missing": [
      {
        "skill": "Kubernetes",
        "importance": "important",
        "alternatives_found": ["Docker", "AWS ECS"]
      }
    ]
  },
  "recommendation": {
    "decision": "strong-yes",
    "confidence": 85,
    "reasoning": "Excellent technical fit with strong Python and AWS background",
    "interview_focus_areas": ["System design", "Leadership experience"],
    "next_steps": "Schedule technical interview"
  }
}
```

### 2. Real-Time Progress Tracking

**WebSocket Events:**
```json
{
  "type": "cv_progress",
  "user_id": "uuid",
  "cv_id": "uuid",
  "batch_id": "uuid",
  "progress": 70,
  "status": "Matching against job requirements...",
  "stage": "MATCHING_JD",
  "filename": "john_doe_resume.pdf",
  "jd_title": "Senior Python Developer"
}
```

**Batch Progress:**
```json
{
  "type": "batch_progress",
  "batch_id": "uuid",
  "total_cvs": 50,
  "queued": 20,
  "processing": 2,
  "completed": 25,
  "failed": 3,
  "percentage": 56.0,
  "avg_processing_time_seconds": 42.3,
  "estimated_time_seconds": 846,
  "estimated_time_minutes": 14.1,
  "queue_details": [
    {
      "cv_id": "uuid",
      "filename": "alice_smith.pdf",
      "queue_position": 1,
      "estimated_wait_seconds": 42
    }
  ]
}
```

### 3. Dynamic Time Estimation

The system learns from actual processing times:

**Algorithm:**
1. Track processing time for each completed CV
2. Calculate average: `(processed_at - created_at)`
3. Use average for estimates: `remaining_cvs * avg_time`
4. Default to 40s for first batch

**Real-Time Updates:**
- Estimates improve as more CVs complete
- Queue position shows exact wait time
- Batch progress updates after each CV

## API Usage

### 1. Create Batch with JD

```bash
POST /api/v1/cv-batches
{
  "title": "Senior Python Developer - Dec 2024",
  "job_description_id": "uuid",  # Link to JD
  "department": "Engineering",
  "location": "Remote"
}
```

### 2. Upload CVs to Batch

```bash
POST /api/v1/cv-batches/{batch_id}/upload
Content-Type: multipart/form-data

files: [resume1.pdf, resume2.pdf, ...]
```

### 3. Start Processing

```bash
POST /api/v1/cv-processing/batch/{batch_id}/process
```

### 4. Connect to WebSocket for Real-Time Updates

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/cv-processing/ws/{user_id}');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'cv_progress') {
    console.log(`CV ${data.filename}: ${data.status} (${data.progress}%)`);
  }

  if (data.type === 'batch_progress') {
    console.log(`Batch: ${data.completed}/${data.total_cvs} completed`);
    console.log(`ETA: ${data.estimated_time_minutes} minutes`);
  }
};
```

### 5. Get Queue Status

```bash
GET /api/v1/cv-processing/batch/{batch_id}/queue-status

Response:
{
  "batch_id": "uuid",
  "total_cvs": 50,
  "queued": 15,
  "processing": 2,
  "completed": 30,
  "failed": 3,
  "percentage": 66.0,
  "avg_processing_time_seconds": 43.2,
  "estimated_time_seconds": 648,
  "estimated_time_minutes": 10.8,
  "queue_details": [...]
}
```

### 6. Get CV Match Details

```bash
GET /api/v1/cvs/{cv_id}

Response:
{
  "id": "uuid",
  "filename": "john_doe.pdf",
  "status": "completed",
  "jd_match_score": 85,
  "jd_match_data": {
    "overall_match_score": 85,
    "technical_skills_match": {...},
    "experience_match": {...},
    "recommendation": {...}
  },
  "parse_detail": {
    "candidate_name": "John Doe",
    "current_role": "Senior Python Developer",
    "total_experience_years": 6,
    ...
  }
}
```

## Scalability

### Horizontal Scaling

**Add More Workers:**
```yaml
# docker-compose.yml
worker:
  image: your-app
  command: celery -A app.core.celery_config worker --loglevel=info
  deploy:
    replicas: 5  # Scale to 5 workers
```

**Benefits:**
- Process multiple CVs in parallel
- Handle CVs from different accounts simultaneously
- Linear scaling with worker count

### Database Optimization

**Indexes:**
- `cv_batches.job_description_id` (indexed)
- `cvs.batch_id` (indexed)
- `cvs.status` (indexed)

**Query Optimization:**
- Batch fetches JD once, not per CV
- Queue status uses aggregation queries
- WebSocket uses Redis pub/sub (no DB polling)

## Cost Tracking

Each CV processing tracks:
- Input tokens used
- Output tokens used
- Total cost (parsing + matching)
- Processing time

**Total Cost Formula:**
```
Total = CV Parsing Cost + JD Matching Cost (if applicable) + GitHub Analysis Cost (if applicable)
```

## Performance

**Typical Processing Times:**
- CV Parsing: 15-25 seconds
- JD Matching: 12-18 seconds
- GitHub Analysis: 8-12 seconds
- **Total**: ~40 seconds per CV

**Throughput:**
- 1 worker: ~90 CVs/hour
- 5 workers: ~450 CVs/hour
- 10 workers: ~900 CVs/hour

## Error Handling

**Failure Scenarios:**
1. **S3 Download Fails**: CV marked as FAILED, user notified
2. **Parsing Fails**: Error logged, CV marked as FAILED
3. **JD Matching Fails**: CV still marked as COMPLETED (parsing succeeded)
4. **Worker Crashes**: Celery retries task automatically

**Retry Logic:**
```bash
POST /api/v1/cv-processing/cv/{cv_id}/retry
```

## Migration Guide

### Running the Migration

```bash
cd backend
alembic upgrade head
```

This adds:
- `cv_batches.job_description_id` column
- `cvs.jd_match_score` column
- `cvs.jd_match_data` column (JSONB)
- Foreign key constraints and indexes

### Backward Compatibility

- `job_description_id` is nullable (optional JD linking)
- If no JD linked, CV is parsed but not matched
- Old CVs continue to work (no match score)
- Frontend should handle null `jd_match_score`

## Monitoring

### Metrics to Track

1. **Processing Metrics**:
   - Average processing time per CV
   - Queue depth
   - Success/failure rates
   - LLM token usage and costs

2. **Business Metrics**:
   - CVs processed per day
   - Average match score distribution
   - Time to process batches
   - Cost per CV

3. **System Metrics**:
   - Worker CPU/memory usage
   - Celery task queue length
   - Redis pub/sub latency
   - Database query performance

### Logging

All events are logged:
```python
logger.info(f"Fetched JD {jd_id} for CV {cv_id}")
logger.info(f"CV {cv_id} matched with score: {match_score}%")
logger.error(f"JD matching failed for CV {cv_id}: {error}")
```

## Future Enhancements

1. **GitHub Analysis**: Complete implementation of GitHub profile scoring
2. **Batch Prioritization**: Allow high-priority batches to jump queue
3. **Auto-Shortlisting**: Automatically shortlist CVs above threshold
4. **Email Notifications**: Notify users when batches complete
5. **Advanced Matching**: ML-based matching for better accuracy
6. **Resume Ranking**: Rank CVs within batch by match score

## Support

For issues or questions:
- Check troubleshooting guide: `CV_PROCESSING_TROUBLESHOOTING.md`
- Review implementation details: `IMPLEMENTATION_SUMMARY.md`
- Run verification script: `python verify_cv_processing.py`

---

**Last Updated**: 2025-12-06
**Version**: 2.0 (Scalable Architecture)

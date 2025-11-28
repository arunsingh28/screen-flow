# ScreenFlow API Guide

## Authentication

All job endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Jobs API

### 1. Create a Job

**POST** `/api/v1/jobs/`

Create a new job posting.

**Request Body:**
```json
{
  "title": "Senior Frontend Engineer",
  "department": "Engineering",
  "location": "Remote",
  "description": "Looking for an experienced frontend developer"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "user_id": 1,
  "title": "Senior Frontend Engineer",
  "department": "Engineering",
  "location": "Remote",
  "description": "Looking for an experienced frontend developer",
  "status": "draft",
  "candidate_count": 0,
  "high_match_count": 0,
  "jd_file_name": null,
  "jd_file_size": null,
  "created_at": "2024-11-28T10:00:00Z",
  "updated_at": null
}
```

---

### 2. Upload Job Description (JD)

**POST** `/api/v1/jobs/{job_id}/upload-jd`

Upload a Job Description file (PDF, DOC, DOCX).

**Request:** `multipart/form-data`
- `file`: Job description file (max 10MB)

**Response:** `200 OK`
```json
{
  "message": "Job description uploaded successfully",
  "file_name": "senior_frontend_jd.pdf",
  "file_size": 245678,
  "file_path": "/tmp/screenflow/uploads/user_1/job_1/jd/senior_frontend_jd.pdf"
}
```

---

### 3. Upload CVs (Bulk)

**POST** `/api/v1/jobs/{job_id}/upload-cvs`

Upload multiple CV files for a job.

**Request:** `multipart/form-data`
- `files`: Array of CV files (PDF, DOC, DOCX, max 10MB each)

**Response:** `200 OK`
```json
{
  "message": "Successfully uploaded 5 CVs",
  "job_id": 1,
  "uploaded_count": 5,
  "failed_count": 0,
  "files": [
    {
      "message": "Success",
      "file_name": "john_doe_cv.pdf",
      "file_size": 123456,
      "file_path": "/tmp/screenflow/uploads/user_1/job_1/cv/john_doe_cv.pdf"
    },
    ...
  ]
}
```

---

### 4. List All Jobs

**GET** `/api/v1/jobs/`

Get paginated list of jobs.

**Query Parameters:**
- `page` (default: 1)
- `page_size` (default: 10)
- `status` (optional): `draft`, `active`, or `closed`

**Response:** `200 OK`
```json
{
  "jobs": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Senior Frontend Engineer",
      "department": "Engineering",
      "location": "Remote",
      "description": "Looking for an experienced frontend developer",
      "status": "draft",
      "candidate_count": 5,
      "high_match_count": 0,
      "jd_file_name": "senior_frontend_jd.pdf",
      "jd_file_size": 245678,
      "created_at": "2024-11-28T10:00:00Z",
      "updated_at": "2024-11-28T10:05:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10
}
```

---

### 5. Get Job Details

**GET** `/api/v1/jobs/{job_id}`

Get detailed information about a job including all CVs.

**Response:** `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "title": "Senior Frontend Engineer",
  "department": "Engineering",
  "location": "Remote",
  "description": "Looking for an experienced frontend developer",
  "status": "draft",
  "candidate_count": 5,
  "high_match_count": 0,
  "jd_file_name": "senior_frontend_jd.pdf",
  "jd_file_size": 245678,
  "created_at": "2024-11-28T10:00:00Z",
  "updated_at": "2024-11-28T10:05:00Z",
  "cvs": [
    {
      "id": 1,
      "job_id": 1,
      "user_id": 1,
      "file_name": "john_doe_cv.pdf",
      "file_path": "/tmp/screenflow/uploads/user_1/job_1/cv/john_doe_cv.pdf",
      "file_size": 123456,
      "status": "queued",
      "error_message": null,
      "candidate_name": null,
      "candidate_email": null,
      "created_at": "2024-11-28T10:05:00Z",
      "processed_at": null
    }
  ]
}
```

---

### 6. Update Job

**PUT** `/api/v1/jobs/{job_id}`

Update job details.

**Request Body:** (all fields optional)
```json
{
  "title": "Senior Frontend Engineer (Updated)",
  "department": "Engineering",
  "location": "Hybrid",
  "description": "Updated description",
  "status": "active"
}
```

**Response:** `200 OK` (same as create response)

---

### 7. Delete Job

**DELETE** `/api/v1/jobs/{job_id}`

Delete a job and all associated CVs.

**Response:** `204 No Content`

---

## Complete Workflow Example

### Step 1: Register/Login

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@company.com",
    "password": "securepass123",
    "company_name": "TechCorp"
  }'

# Save the token from response
TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### Step 2: Create a Job

```bash
curl -X POST http://localhost:8000/api/v1/jobs/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Backend Engineer",
    "department": "Engineering",
    "location": "Remote",
    "description": "Looking for Python/FastAPI expert"
  }'

# Save job_id from response
JOB_ID=1
```

### Step 3: Upload Job Description

```bash
curl -X POST http://localhost:8000/api/v1/jobs/$JOB_ID/upload-jd \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/job_description.pdf"
```

### Step 4: Upload CVs

```bash
curl -X POST http://localhost:8000/api/v1/jobs/$JOB_ID/upload-cvs \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/path/to/cv1.pdf" \
  -F "files=@/path/to/cv2.pdf" \
  -F "files=@/path/to/cv3.pdf"
```

### Step 5: Check Job Status

```bash
curl -X GET http://localhost:8000/api/v1/jobs/$JOB_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6: List All Jobs

```bash
curl -X GET "http://localhost:8000/api/v1/jobs/?page=1&page_size=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## File Upload Requirements

- **Supported formats:** PDF, DOC, DOCX
- **Max file size:** 10MB per file
- **Storage location:** `/tmp/screenflow/uploads/user_{user_id}/job_{job_id}/`
  - JD files: `jd/` subdirectory
  - CV files: `cv/` subdirectory

---

## Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Deleted successfully
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error

---

## Error Response Format

```json
{
  "detail": "Error message here"
}
```

---

## Next Steps

- [ ] Add AI processing for CVs
- [ ] Implement semantic search
- [ ] Add candidate matching scores
- [ ] Generate analytics and insights

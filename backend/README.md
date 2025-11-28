# ScreenFlow API Backend

Production-ready REST API backend for ScreenFlow, a CV screening platform built with FastAPI, PostgreSQL, and Redis.

## Tech Stack

- **Framework:** FastAPI 0.104.1
- **Server:** Uvicorn (ASGI server)
- **Database:** PostgreSQL 15+
- **Cache:** Redis 7+
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Authentication:** JWT with python-jose
- **Password Hashing:** Bcrypt
- **Validation:** Pydantic v2

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py          # Dependencies (auth, db session)
│   │   └── v1/
│   │       ├── auth.py      # Authentication endpoints
│   │       └── users.py     # User endpoints
│   ├── core/
│   │   ├── config.py        # Settings and configuration
│   │   └── security.py      # JWT and password utilities
│   ├── models/
│   │   └── user.py          # SQLAlchemy models
│   ├── schemas/
│   │   └── user.py          # Pydantic schemas
│   ├── database.py          # Database connection
│   └── main.py              # FastAPI application
├── alembic/                 # Database migrations
├── tests/                   # Test files
├── docker-compose.yml       # Docker services configuration
├── Dockerfile              # API container image
├── requirements.txt        # Python dependencies
└── .env.example           # Environment variables template
```

## Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development without Docker)

## Quick Start with Docker

### 1. Clone and Setup

```bash
cd backend
cp .env.example .env
```

### 2. Start All Services

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **FastAPI** on port 8000

### 3. Check Service Health

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f api

# Check API health
curl http://localhost:8000/health
```

### 4. Access API Documentation

- **Swagger UI:** http://localhost:8000/api/v1/docs
- **ReDoc:** http://localhost:8000/api/v1/redoc
- **OpenAPI JSON:** http://localhost:8000/api/v1/openapi.json

## Local Development (Without Docker)

### 1. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start PostgreSQL and Redis

```bash
# Start only database services
docker-compose up -d postgres redis
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your local settings
```

### 4. Run Database Migrations

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 5. Start Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL=postgresql://screenflow:screenflow_dev_password@localhost:5432/screenflow_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Security (CHANGE IN PRODUCTION!)
SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# API
API_V1_PREFIX=/api/v1
PROJECT_NAME=ScreenFlow API

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# Environment
ENVIRONMENT=development
```

## API Endpoints

### Authentication

#### Register New User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "company_name": "Tech Corp"
}
```

#### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "company_name": "Tech Corp",
    "created_at": "2024-11-28T10:00:00Z"
  },
  "token": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
  }
}
```

### Protected Endpoints

#### Get Current User
```bash
GET /api/v1/users/me
Authorization: Bearer <your-token>
```

## Database Migrations

### Create a New Migration

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply Migrations

```bash
# Upgrade to latest
alembic upgrade head

# Downgrade one revision
alembic downgrade -1

# View migration history
alembic history
```

### Reset Database

```bash
# Stop and remove volumes
docker-compose down -v

# Restart services
docker-compose up -d

# Apply migrations
docker-compose exec api alembic upgrade head
```

## Docker Commands

### Rebuild Containers

```bash
docker-compose up -d --build
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
```

### Execute Commands in Container

```bash
# Run migrations
docker-compose exec api alembic upgrade head

# Access Python shell
docker-compose exec api python

# Access database
docker-compose exec postgres psql -U screenflow -d screenflow_db
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (DELETES DATA!)
docker-compose down -v
```

## Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## Security

### Production Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Use strong database passwords
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable database connection pooling
- [ ] Use environment-specific configurations
- [ ] Set up monitoring and logging
- [ ] Regular security updates

### Generate Secret Key

```python
import secrets
print(secrets.token_urlsafe(32))
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Connection Issues

```bash
# Check Redis status
docker-compose exec redis redis-cli ping
# Should return: PONG

# View Redis logs
docker-compose logs redis
```

## Next Steps

This is a basic foundation. To extend the API:

1. **Add CV Upload:** Implement file upload endpoints with PDF processing
2. **Background Tasks:** Add Celery for async processing
3. **Storage:** Integrate AWS S3 or MinIO for file storage
4. **Vector Search:** Add Pinecone for semantic search
5. **AI Integration:** Add OpenAI/Claude/Gemini for CV analysis
6. **Rate Limiting:** Implement request rate limiting
7. **Monitoring:** Add logging and metrics (Prometheus, Grafana)
8. **Testing:** Write comprehensive test suite

## License

Proprietary - ScreenFlow

## Support

For issues and questions, please contact the development team.

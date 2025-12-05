#!/bin/bash

# CV Processing Startup Script
# This script helps you start and verify CV processing setup

set -e  # Exit on error

echo "=================================================="
echo "   ScreenFlow CV Processing - Startup Script"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Check if .env exists
echo "Checking configuration..."
if [ ! -f .env ]; then
    echo -e "${RED}✗${NC} .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠${NC}  Please edit .env and add your OPENAI_API_KEY"
    exit 1
fi

# Check required env vars
source .env

echo ""
echo "Verifying environment variables..."

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-..." ]; then
    echo -e "${RED}✗${NC} OPENAI_API_KEY not set in .env"
    echo "Please add your OpenAI API key to .env:"
    echo "  OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE"
    exit 1
else
    echo -e "${GREEN}✓${NC} OPENAI_API_KEY configured"
fi

if [ -z "$LLM_PROVIDER" ]; then
    echo -e "${YELLOW}⚠${NC}  LLM_PROVIDER not set, defaulting to 'openai'"
    export LLM_PROVIDER=openai
elif [ "$LLM_PROVIDER" = "openai" ]; then
    echo -e "${GREEN}✓${NC} LLM_PROVIDER set to 'openai'"
else
    echo -e "${YELLOW}⚠${NC}  LLM_PROVIDER set to '$LLM_PROVIDER' (expected 'openai')"
fi

echo ""
echo "Checking services..."

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis is running"
else
    echo -e "${YELLOW}⚠${NC}  Redis not running, starting..."
    docker-compose -f docker-compose.dev.yml up -d redis
    sleep 2
fi

# Check PostgreSQL
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL is running"
else
    echo -e "${YELLOW}⚠${NC}  PostgreSQL not running, starting..."
    docker-compose -f docker-compose.dev.yml up -d postgres
    sleep 3
fi

echo ""
echo "Running database migration..."
alembic upgrade head
print_status $? "Database migration"

echo ""
echo "=================================================="
echo "   Starting CV Processing Services"
echo "=================================================="
echo ""

# Check if user wants to start with docker or manually
echo "How do you want to start the services?"
echo "1) Docker Compose (recommended)"
echo "2) Manual (for development)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo ""
        echo "Starting services with Docker Compose..."
        docker-compose -f docker-compose.dev.yml up -d

        echo ""
        echo "Waiting for services to be ready..."
        sleep 5

        echo ""
        echo "Services started!"
        echo ""
        echo "View logs:"
        echo "  Backend:  docker-compose -f docker-compose.dev.yml logs api -f"
        echo "  Worker:   docker-compose -f docker-compose.dev.yml logs worker -f"
        echo "  All:      docker-compose -f docker-compose.dev.yml logs -f"
        echo ""
        echo "API is running at: http://localhost:8000"
        echo "API Docs: http://localhost:8000/api/v1/docs"
        ;;

    2)
        echo ""
        echo "Starting services manually..."
        echo ""
        echo "Terminal 1 (Backend API):"
        echo "  uvicorn app.main:app --reload --port 8000"
        echo ""
        echo "Terminal 2 (Celery Worker) - Required for CV processing:"
        echo "  celery -A app.core.celery_config.celery_app worker --loglevel=info"
        echo ""
        echo "Press Enter to start Backend API..."
        read

        # Start backend in background
        uvicorn app.main:app --reload --port 8000 &
        BACKEND_PID=$!

        echo "Backend started (PID: $BACKEND_PID)"
        echo ""
        echo "Now starting Celery worker (this is required for CV processing)..."
        sleep 2

        # Start celery worker
        celery -A app.core.celery_config.celery_app worker --loglevel=info
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo "   CV Processing Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Upload CVs via the API or frontend"
echo "2. Trigger processing: POST /api/v1/cv-processing/batch/{batch_id}/process"
echo "3. Monitor progress: GET /api/v1/cv-processing/batch/{batch_id}/queue-status"
echo ""
echo "For troubleshooting, see: CV_PROCESSING_TROUBLESHOOTING.md"
echo ""

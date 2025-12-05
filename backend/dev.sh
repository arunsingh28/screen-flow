#!/bin/bash

# ScreenFlow Backend Development Script

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ScreenFlow Backend Development${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
fi

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}✗ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker is running${NC}"
}

# Function to start services
start_services() {
    echo -e "${BLUE}Starting services...${NC}"
    docker compose -f docker-compose.dev.yml up -d

    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 5

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Services are running!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "🚀 API Server: ${BLUE}http://localhost:8000${NC}"
    echo -e "📚 API Docs: ${BLUE}http://localhost:8000/api/v1/docs${NC}"
    echo -e "🗄️  PostgreSQL: ${BLUE}localhost:5432${NC}"
    echo -e "💾 Redis: ${BLUE}localhost:6379${NC}"
    echo ""
    echo -e "${YELLOW}To view logs, run:${NC} docker compose logs -f"
    echo -e "${YELLOW}To stop services, run:${NC} docker compose down"
    echo ""
}

# Function to view logs
view_logs() {
    echo -e "${BLUE}Viewing logs (Ctrl+C to exit)...${NC}"
    docker compose -f docker-compose.dev.yml logs -f
}

# Function to stop services
stop_services() {
    echo -e "${BLUE}Stopping services...${NC}"
    docker compose -f docker-compose.dev.yml down
    echo -e "${GREEN}✓ Services stopped${NC}"
}

# Function to rebuild
rebuild() {
    echo -e "${BLUE}Rebuilding services...${NC}"
    docker compose -f docker-compose.dev.yml down
    docker compose -f docker-compose.dev.yml build --no-cache
    docker compose -f docker-compose.dev.yml up -d
    echo -e "${GREEN}✓ Services rebuilt and started${NC}"
}

# Main menu
case "${1:-start}" in
    start)
        check_docker
        start_services
        ;;
    logs)
        view_logs
        ;;
    stop)
        stop_services
        ;;
    restart)
        check_docker
        echo -e "${BLUE}Restarting services...${NC}"
        docker compose -f docker-compose.dev.yml restart
        echo -e "${GREEN}✓ Services restarted${NC}"
        ;;
    rebuild)
        check_docker
        rebuild
        ;;
    install)
        check_docker
        rebuild
        ;;
    shell)
        docker compose -f docker-compose.dev.yml exec api /bin/bash
        ;;
    migrate)
        echo -e "${BLUE}Running database migrations...${NC}"
        docker compose -f docker-compose.dev.yml exec api alembic upgrade head
        echo -e "${GREEN}✓ Migrations completed${NC}"
        ;;
    *)
        echo "Usage: ./dev.sh {start|logs|stop|restart|rebuild|install|shell|migrate}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services (default)"
        echo "  logs    - View logs from all services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  rebuild - Rebuild and restart services"
        echo "  install - Rebuild and restart services (alias for rebuild)"
        echo "  shell   - Open shell in API container"
        echo "  migrate - Run database migrations"
        exit 1
        ;;
esac

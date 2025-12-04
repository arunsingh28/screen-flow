.PHONY: help build up down restart logs shell db-shell redis-shell migrate migration test clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

build: ## Build all Docker containers
	docker compose build

up: ## Start all services in detached mode
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@sleep 3
	@echo "Services are running!"
	@echo "API: http://localhost:8000"
	@echo "Docs: http://localhost:8000/api/v1/docs"
	@echo ""
	@echo "To view logs, run: make logs"

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## View logs from all services
	docker compose logs -f

logs-api: ## View logs from API service only
	docker compose logs -f api

logs-db: ## View logs from database service only
	docker compose logs -f postgres

shell: ## Open a shell in the API container
	docker compose exec api /bin/bash

db-shell: ## Open PostgreSQL shell
	docker compose exec postgres psql -U screenflow -d screenflow_db

redis-shell: ## Open Redis CLI
	docker compose exec redis redis-cli

migrate: ## Run database migrations
	docker compose exec api alembic upgrade head

migration: ## Create a new migration (use MESSAGE="your message")
	docker compose exec api alembic revision --autogenerate -m "$(MESSAGE)"

test: ## Run tests
	docker compose exec api pytest

clean: ## Stop services and remove volumes (WARNING: deletes all data!)
	docker compose down -v

status: ## Show status of all services
	docker compose ps

rebuild: down build up ## Rebuild and restart all services

# Development targets using docker-compose.dev.yml
dev-up: ## Start dev services
	docker compose -f docker-compose.dev.yml up -d
	@echo "Waiting for services to be healthy..."
	@sleep 3
	@echo "Services are running!"
	@echo "API: http://localhost:8000"
	@echo "Docs: http://localhost:8000/api/v1/docs"

dev-down: ## Stop dev services
	docker compose -f docker-compose.dev.yml down

dev-build: ## Build dev services
	docker compose -f docker-compose.dev.yml build

dev-logs: ## View dev logs
	docker compose -f docker-compose.dev.yml logs -f

dev-restart: ## Restart dev services
	docker compose -f docker-compose.dev.yml restart

dev-shell: ## Open shell in dev API container
	docker compose -f docker-compose.dev.yml exec api /bin/bash

dev-migrate: ## Run migrations in dev
	docker compose -f docker-compose.dev.yml exec api alembic upgrade head

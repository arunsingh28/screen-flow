#!/bin/bash
set -e

echo "Waiting for database to be ready..."

# Wait for PostgreSQL to be ready
until pg_isready -d "$DATABASE_URL" 2>/dev/null; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

echo "Running database migrations..."
if alembic upgrade head; then
  echo "Migrations completed successfully"
else
  echo "Migration failed or already applied, checking current version..."
  alembic current || true
fi

echo "Starting application..."
exec "$@"
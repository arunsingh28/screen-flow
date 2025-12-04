#!/bin/bash
set -e

echo "Parsing DATABASE_URL..."

# Extract Postgres connection info from DATABASE_URL
# Example: postgresql://user:pass@host:5432/dbname
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:]+).*/\1/')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's/.*:([0-9]+)\/.*/\1/')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's:.*/([^/?]+).*:\1:')

echo "Waiting for Postgres at $DB_HOST:$DB_PORT to be ready..."

# Wait for database readiness
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" > /dev/null 2>&1; do
  echo "Postgres is unavailable — retrying..."
  sleep 2
done

echo "Database is ready!"

echo "Running Alembic migrations..."
set +e
alembic upgrade head
MIGRATION_RESULT=$?
set -e

if [ $MIGRATION_RESULT -ne 0 ]; then
  echo "Migration failed. Checking Alembic current version..."
  alembic current
  echo "Exiting due to failed migrations."
  exit 1
fi

echo "Migrations applied successfully."

echo "Starting application..."
exec "$@"

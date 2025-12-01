# Automated Database Migrations

## Overview
Database migrations now run **automatically** during deployment. No manual intervention required!

## How It Works

### 1. **Entrypoint Script** (`backend/entrypoint.sh`)
Every time the Docker container starts, it:
1. Runs `alembic upgrade head` to apply any pending migrations
2. Starts the FastAPI server

### 2. **GitHub Actions CI/CD** (`.github/workflows/ci.yml`)
When you push to `main`:
1. Builds the Docker image (includes entrypoint script)
2. Pushes to Amazon ECR
3. Deploys to EC2
4. Containers start → **migrations run automatically**
5. Verifies migrations were applied successfully

## Local Development

### Running Migrations Manually
```bash
cd backend
docker exec screenflow-api alembic upgrade head
```

### Creating New Migrations
```bash
cd backend
docker exec screenflow-api alembic revision --autogenerate -m "description"
```

## Production Deployment

**Zero manual steps required!**

Just push your code:
```bash
git add .
git commit -m "Add new feature"
git push origin main
```

The GitHub Actions workflow will:
- ✅ Build new Docker image
- ✅ Apply database migrations
- ✅ Deploy to production
- ✅ Verify everything works

## Migration Safety

- Migrations run in a **transaction** (automatic rollback on failure)
- Server won't start if migrations fail
- Deployment logs show migration status
- Old data is preserved

## Troubleshooting

If migrations fail during deployment:
1. Check GitHub Actions logs
2. SSH into EC2: `ssh user@server`
3. View container logs: `docker-compose logs api`
4. Manually verify: `docker-compose exec api alembic current`

## Best Practices

✅ **Always test migrations locally first**
✅ **Review migration files before committing**
✅ **Keep migrations backwards-compatible when possible**
✅ **Never edit committed migration files**

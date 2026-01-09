# Event Master API

FastAPI backend service for Event Master registration system.

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload
```

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

This service is deployed to AWS ECS Fargate via GitHub Actions.
See `/.github/workflows/deploy-api.yml` for CI/CD configuration.

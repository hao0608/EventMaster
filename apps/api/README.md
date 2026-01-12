# Event Master API

FastAPI backend service for Event Master registration system with SQLAlchemy ORM.

## Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control (RBAC)** - Member, Organizer, Admin roles
- **Event Management** - Create, update, delete events
- **Registration System** - User registration with QR codes
- **Check-in & Verification** - QR code scanning and walk-in registration
- **User Management** - Admin panel for managing users and roles

## Tech Stack

- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - SQL ORM for database operations
- **Pydantic** - Data validation and serialization
- **Python-JOSE** - JWT token generation and verification
- **Passlib** - Password hashing with bcrypt
- **PostgreSQL/SQLite** - Database (configurable)

## Project Structure

```
apps/api/
├── main.py                 # FastAPI application entry point
├── seed_data.py           # Database seeding script
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── Dockerfile            # Docker configuration
└── src/
    ├── core/             # Core utilities
    │   ├── config.py     # Application settings
    │   ├── security.py   # JWT & password hashing
    │   └── deps.py       # FastAPI dependencies
    ├── models/           # SQLAlchemy ORM models
    │   ├── user.py
    │   ├── event.py
    │   └── registration.py
    ├── schemas/          # Pydantic schemas
    │   ├── user.py
    │   ├── auth.py
    │   ├── event.py
    │   ├── registration.py
    │   └── checkin.py
    ├── routes/           # API endpoints
    │   ├── auth.py
    │   ├── events.py
    │   ├── registrations.py
    │   ├── checkin.py
    │   └── users.py
    └── database.py       # Database configuration
```

## Setup

### 1. Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Important: Change SECRET_KEY in production!
```

### 3. Initialize Database

```bash
# Seed database with test data
python seed_data.py
```

This creates test accounts:
- **Member**: member@company.com / password123
- **Organizer**: org@company.com / password123
- **Admin**: admin@company.com / password123

### 4. Run Development Server

```bash
# Run with auto-reload
uvicorn main:app --reload

# Or use Python directly
python main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## API Documentation

See `/docs/openapi.yaml` for the complete API specification.

### Authentication

All authenticated endpoints require a Bearer token:

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "member@company.com", "password": "password123"}'

# Use token in subsequent requests
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer <your-token>"
```

### Key Endpoints

- `POST /auth/login` - Login with email/password
- `GET /auth/me` - Get current user info
- `GET /events` - List all events
- `POST /events` - Create event (Organizer/Admin)
- `POST /events/{id}/registrations` - Register for event
- `GET /me/registrations` - Get my registrations
- `POST /verify` - Verify ticket and check-in (Organizer/Admin)
- `POST /walk-in` - Walk-in registration (Organizer/Admin)
- `GET /users` - List all users (Admin)

## Database

### SQLite (Development)

Default configuration uses SQLite for easy development:

```env
DATABASE_URL=sqlite:///./eventmaster.db
```

### PostgreSQL (Production)

For production, use PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/eventmaster_db
```

### Migrations (Optional)

For production, consider using Alembic for migrations:

```bash
# Initialize Alembic (if needed)
alembic init alembic

# Generate migration
alembic revision --autogenerate -m "Initial migration"

# Run migration
alembic upgrade head
```

## Docker

### Build and Run

```bash
# Build image
docker build -t eventmaster-api .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=sqlite:///./eventmaster.db \
  -e SECRET_KEY=your-secret-key \
  eventmaster-api
```

### Docker Compose (with PostgreSQL)

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: eventmaster_db
      POSTGRES_USER: eventmaster
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://eventmaster:password@db:5432/eventmaster_db
      SECRET_KEY: your-secret-key-change-in-production
    depends_on:
      - db

volumes:
  postgres_data:
```

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=src tests/
```

## Deployment

This service is deployed to AWS ECS Fargate via GitHub Actions.
See `/.github/workflows/deploy-api.yml` for CI/CD configuration.

### Production Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Set `DEBUG=False`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Review security settings

## License

See LICENSE file in repository root.

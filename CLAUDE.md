# CLAUDE.md - EventMaster AI Assistant Guide

> **Purpose**: This document provides AI assistants (like Claude) with comprehensive context about the EventMaster codebase structure, development workflows, conventions, and best practices.

**Last Updated**: 2026-01-13
**Repository**: EventMaster - Event Registration & Check-in System
**Architecture**: Monorepo (Frontend + Backend)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Architecture Layers](#architecture-layers)
5. [Development Workflows](#development-workflows)
6. [Key Conventions](#key-conventions)
7. [Testing Strategy](#testing-strategy)
8. [Deployment](#deployment)
9. [Common Development Tasks](#common-development-tasks)
10. [Project Constitution](#project-constitution)
11. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

**EventMaster** is a complete event registration and check-in system with QR code-based ticket verification. It implements JWT authentication with Role-Based Access Control (RBAC) supporting three user roles: **member**, **organizer**, and **admin**.

### Core Features

- **Event Management**: Create, edit, and manage events
- **Registration System**: User registration with automated QR code generation
- **Check-in Verification**: QR code scanning and walk-in registration
- **User Management**: Admin panel for role assignment
- **JWT Authentication**: Secure token-based authentication
- **RBAC**: Three-tier permission system (member/organizer/admin)

### Target Scale

- Small to medium scale: <200 concurrent users
- MVP focus: Complete core flow working in production
- Emphasis on: Fast deployment, low maintenance, clear permission separation

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **member** | View events, register for events, view own tickets (QR codes) |
| **organizer** | All member permissions + create events, view attendee lists, verify tickets, walk-in registration |
| **admin** | All organizer permissions + manage all events, manage user roles |

---

## Repository Structure

This is a **monorepo** containing both frontend and backend applications:

```
EventMaster/
├── apps/
│   ├── web/                     # Frontend (React + TypeScript + Vite)
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navbar.tsx       # Navigation bar with role-based rendering
│   │   │   └── ProtectedRoute.tsx # Route guard for auth & authorization
│   │   ├── contexts/            # React Context for global state
│   │   │   └── AuthContext.tsx  # User auth state & localStorage persistence
│   │   ├── pages/               # Route components (views)
│   │   │   ├── Login.tsx        # Email/password login
│   │   │   ├── Events.tsx       # Event listing
│   │   │   ├── EventDetail.tsx  # Event details & registration
│   │   │   ├── EditEvent.tsx    # Edit event page
│   │   │   ├── MyTickets.tsx    # User's tickets with QR codes
│   │   │   ├── OrganizerVerify.tsx # Ticket verification & walk-in
│   │   │   ├── EventAttendees.tsx  # Attendee list
│   │   │   ├── AdminCreateEvent.tsx # Create event form
│   │   │   └── AdminUsers.tsx   # User role management
│   │   ├── services/            # API layer
│   │   │   └── mockApi.ts       # Mock API (to be replaced with real API)
│   │   ├── types.ts             # TypeScript type definitions
│   │   ├── App.tsx              # Main app component & routing
│   │   ├── index.tsx            # Entry point
│   │   ├── vite.config.ts       # Vite configuration
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   └── package.json         # Frontend dependencies
│   │
│   └── api/                     # Backend (FastAPI + SQLAlchemy)
│       ├── src/
│       │   ├── core/            # Core utilities
│       │   │   ├── config.py    # Settings (Pydantic Settings)
│       │   │   ├── security.py  # JWT & password hashing (bcrypt)
│       │   │   └── deps.py      # FastAPI dependencies (auth, db)
│       │   ├── models/          # SQLAlchemy ORM models
│       │   │   ├── user.py      # User model (email, role, password_hash)
│       │   │   ├── event.py     # Event model (title, capacity, etc.)
│       │   │   └── registration.py # Registration model (QR code, status)
│       │   ├── schemas/         # Pydantic validation schemas
│       │   │   ├── auth.py      # Login request/response
│       │   │   ├── user.py      # User schemas
│       │   │   ├── event.py     # Event create/update/response
│       │   │   ├── registration.py # Registration schemas
│       │   │   └── checkin.py   # Check-in verification schemas
│       │   ├── routes/          # API endpoint definitions
│       │   │   ├── auth.py      # /auth/login, /auth/me
│       │   │   ├── events.py    # Event CRUD endpoints
│       │   │   ├── registrations.py # Registration endpoints
│       │   │   ├── checkin.py   # Verification & walk-in
│       │   │   └── users.py     # User management (admin only)
│       │   └── database.py      # Database setup & session management
│       ├── main.py              # FastAPI app entry point
│       ├── seed_data.py         # Database seeding script
│       ├── requirements.txt     # Python dependencies
│       ├── Dockerfile           # Docker configuration
│       └── .env.example         # Environment variables template
│
├── docs/                        # Documentation
│   ├── MVP_SPEC.md             # Product specification & requirements
│   ├── FRONTEND_ARCH.md        # Frontend architecture details
│   ├── BACKEND_ARCHITECTURE.md # Backend architecture deep-dive
│   └── openapi.yaml            # OpenAPI 3.0 API specification
│
├── .specify/                    # Feature specification system
│   ├── memory/
│   │   └── constitution.md      # Project constitution & principles
│   └── templates/               # Templates for specs, plans, tasks
│
├── .claude/                     # Claude Code configuration
│   └── commands/                # Custom Claude skills (speckit)
│
├── package.json                 # Monorepo root package.json
├── README.md                    # Project overview & quick start
└── CLAUDE.md                    # This file
```

---

## Technology Stack

### Frontend (`apps/web/`)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 | UI components & rendering |
| **Language** | TypeScript | Type safety & developer experience |
| **Build Tool** | Vite | Fast dev server & optimized builds |
| **Routing** | React Router v6 | Client-side routing |
| **State Management** | React Context API | Auth state & global state |
| **Styling** | Tailwind CSS (implied) | Utility-first CSS |
| **Testing** | Vitest + React Testing Library | Unit & component tests |
| **Hosting** | Cloudflare Pages | Static site hosting |

### Backend (`apps/api/`)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | FastAPI 0.109.0 | REST API framework |
| **Language** | Python 3.11+ | Backend logic |
| **Server** | Uvicorn | ASGI server |
| **ORM** | SQLAlchemy 2.0.25 | Database abstraction |
| **Migrations** | Alembic 1.13.1 | Database schema management |
| **Database (Dev)** | SQLite | Local development |
| **Database (Prod)** | PostgreSQL | Production database |
| **Validation** | Pydantic 2.5.3 | Request/response validation |
| **Authentication** | python-jose + JWT | Token generation & verification |
| **Password Hashing** | passlib + bcrypt | Secure password storage |
| **Testing** | pytest + httpx | Unit & integration tests |
| **Hosting** | AWS ECS Fargate | Containerized deployment |

---

## Architecture Layers

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│              (Frontend / Mobile / CLI)                   │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 API Layer (Routes)                       │
│   auth.py | events.py | registrations.py | checkin.py   │
│   • Request validation (Pydantic schemas)                │
│   • Response serialization                               │
│   • Dependency injection                                 │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│          Business Logic Layer (Services)                 │
│   • JWT generation/verification (security.py)            │
│   • Authorization checks (deps.py)                       │
│   • Password hashing (security.py)                       │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│         Data Access Layer (ORM Models)                   │
│   User | Event | Registration                            │
│   • Relationships & constraints                          │
│   • Query methods                                        │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 Database Layer                           │
│         PostgreSQL (prod) / SQLite (dev)                 │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │◄────┐
│ email (UQ)   │     │
│ password_hash│     │
│ display_name │     │
│ role (enum)  │     │
└──────────────┘     │
       │             │ N:1
       │ 1:N         │
       ▼             │
┌──────────────┐     │
│   events     │     │
├──────────────┤     │
│ id (PK)      │     │
│ organizer_id ├─────┘
│ title        │
│ description  │
│ start_at     │
│ end_at       │
│ location     │
│ capacity     │
│ reg_count    │
└──────────────┘
       │
       │ 1:N
       ▼
┌─────────────────┐
│ registrations   │
├─────────────────┤
│ id (PK)         │
│ event_id (FK)   │
│ user_id (FK)    │
│ status (enum)   │ ← registered | checked_in | cancelled
│ qr_code (UQ)    │ ← Unique verification token
│ created_at      │
│ event_title     │ ← Denormalized for performance
│ event_start_at  │ ← Denormalized for performance
└─────────────────┘
```

**Key Design Decisions**:
- **Denormalization**: `event_title` and `event_start_at` stored in registrations for faster "My Tickets" queries
- **QR Code**: Unique string token for verification (not actual QR image)
- **Indexes**: Composite index on (event_id, user_id) for duplicate check
- **Cascade Delete**: Deleting event removes all registrations

---

## Development Workflows

### Branch Strategy (NON-NEGOTIABLE)

**All development MUST happen on feature branches. Direct commits to main are PROHIBITED.**

```bash
# Create feature branch
git checkout -b feature/123-add-email-notifications

# OR for bug fixes
git checkout -b fix/456-ticket-validation-error

# Work on your changes
git add .
git commit -m "feat: Add email notification service"

# Push to remote
git push -u origin feature/123-add-email-notifications

# Create pull request via GitHub
```

**Branch Naming Convention**:
- Format: `<type>/<issue-number>-<short-description>`
- Types: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`
- Example: `feature/42-qr-code-scanner`

### Git Commit Conventions

Use **conventional commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

**Examples**:
```bash
feat(api): Add walk-in registration endpoint
fix(web): Fix QR code generation for special characters
docs: Update API documentation with new endpoints
refactor(api): Extract authentication logic to service layer
test(web): Add tests for event registration flow
```

### Local Development Setup

#### Frontend Setup

```bash
# Navigate to frontend
cd apps/web

# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Backend Setup

```bash
# Navigate to backend
cd apps/api

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env and change SECRET_KEY for security!

# Seed database with test data
python seed_data.py

# Start development server (http://localhost:8000)
uvicorn main:app --reload

# View auto-generated API docs
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

**Test Accounts** (after running `seed_data.py`):
- Member: `member@company.com` / `password123`
- Organizer: `org@company.com` / `password123`
- Admin: `admin@company.com` / `password123`

### Pull Request Process

1. **Create PR** from feature branch to `main`
2. **PR Requirements**:
   - ✅ All tests pass
   - ✅ Code review approved (at least 1 reviewer)
   - ✅ No merge conflicts
   - ✅ Branch up-to-date with main
   - ✅ Documentation updated (if API/interface changed)
   - ✅ No decrease in test coverage
3. **Merge** using "Squash and merge" for clean history
4. **Delete** feature branch after merge

---

## Key Conventions

### Python Conventions (Backend)

```python
# 1. Use type hints for all function signatures
def create_event(
    event_data: EventCreate,
    db: Session,
    user_id: str
) -> Event:
    """Create a new event."""
    pass

# 2. Use Pydantic for validation
class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    capacity: int = Field(..., ge=1, le=10000)

# 3. Use async/await for I/O operations (when needed)
async def fetch_external_data():
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# 4. Error handling with FastAPI HTTPException
from fastapi import HTTPException, status

if not event:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Event not found"
    )

# 5. Use context managers for resources
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### TypeScript Conventions (Frontend)

```typescript
// 1. Define interfaces for all data structures
interface Event {
  id: string;
  title: string;
  startAt: string;
  capacity: number;
  registeredCount: number;
}

// 2. Use functional components with hooks
const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Fetch events
  }, []);

  return <div>{/* render events */}</div>;
};

// 3. Avoid 'any' type - use 'unknown' if needed
const handleData = (data: unknown) => {
  if (typeof data === 'string') {
    // Type-safe handling
  }
};

// 4. Use custom hooks for shared logic
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// 5. Error handling for API calls
const registerForEvent = async (eventId: string) => {
  try {
    setLoading(true);
    const response = await mockApi.registerForEvent(eventId);
    setRegistration(response);
  } catch (error) {
    setError('Failed to register for event');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### API Design Conventions

**RESTful URL Structure**:
```
GET    /events              # List all events
POST   /events              # Create event (organizer/admin)
GET    /events/{id}         # Get event details
PATCH  /events/{id}         # Update event
DELETE /events/{id}         # Delete event

POST   /events/{id}/registrations  # Register for event
GET    /events/{id}/attendees      # Get attendees (organizer/admin)

GET    /me/registrations    # Get my registrations
DELETE /registrations/{id}  # Cancel registration

POST   /verify              # Verify ticket (organizer/admin)
POST   /walk-in             # Walk-in registration (organizer/admin)

GET    /users               # List users (admin)
PATCH  /users/{id}/role     # Update user role (admin)
```

**HTTP Status Codes**:
- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Business logic error
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error

**Error Response Format**:
```json
{
  "error": "ValidationError",
  "message": "Invalid input data",
  "details": {
    "capacity": "Must be greater than 0"
  }
}
```

### Authentication Flow

```
1. Login Request
   POST /auth/login
   Body: { "email": "user@example.com", "password": "secret" }

2. Server Response
   { "user": {...}, "accessToken": "eyJhbGc..." }

3. Subsequent Requests
   GET /events
   Headers: { "Authorization": "Bearer eyJhbGc..." }

4. Token Verification
   - Server extracts token from Authorization header
   - Verifies JWT signature and expiration
   - Extracts user_id from token payload
   - Loads user from database
   - Checks role-based permissions
```

---

## Testing Strategy

### Backend Testing (pytest)

**Test File Structure**:
```
apps/api/
└── tests/
    ├── conftest.py          # Shared fixtures
    ├── test_auth.py         # Auth endpoint tests
    ├── test_events.py       # Event endpoint tests
    ├── test_registrations.py
    └── test_checkin.py
```

**Test Types**:

1. **Unit Tests** - Test individual functions
```python
def test_password_hashing():
    password = "test123"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)
```

2. **Integration Tests** - Test API endpoints
```python
def test_register_for_event(client, test_user, test_event):
    response = client.post(
        f"/events/{test_event.id}/registrations",
        headers={"Authorization": f"Bearer {test_user.token}"}
    )
    assert response.status_code == 201
    assert "qr_code" in response.json()
```

3. **Authorization Tests** - Test RBAC
```python
def test_organizer_only_endpoint(client, member_user):
    response = client.post(
        "/verify",
        headers={"Authorization": f"Bearer {member_user.token}"},
        json={"qr_code": "test"}
    )
    assert response.status_code == 403
```

### Frontend Testing (Vitest + React Testing Library)

**Test File Structure**:
```
apps/web/
└── __tests__/
    ├── components/
    │   ├── Navbar.test.tsx
    │   └── ProtectedRoute.test.tsx
    ├── pages/
    │   ├── Login.test.tsx
    │   └── Events.test.tsx
    └── services/
        └── mockApi.test.ts
```

**Component Test Example**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Login } from '../pages/Login';

test('should show error on failed login', async () => {
  render(<Login />);

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'wrong@example.com' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'wrong' }
  });

  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
});
```

### Running Tests

```bash
# Backend tests
cd apps/api
pytest                    # Run all tests
pytest -v                 # Verbose output
pytest --cov=src tests/   # With coverage report
pytest tests/test_auth.py # Run specific file

# Frontend tests
cd apps/web
npm test                  # Run all tests
npm test -- --coverage    # With coverage
npm test Login.test.tsx   # Run specific file
```

---

## Deployment

### Frontend Deployment (Cloudflare Pages)

**Automatic Deployment**:
- Pushes to `main` trigger automatic deployment
- Build command: `cd apps/web && npm ci && npm run build`
- Build output directory: `apps/web/dist`
- Root directory: `/` (monorepo root)

**Manual Setup**:
1. Connect GitHub repo to Cloudflare Pages
2. Configure build settings:
   - Framework preset: Vite
   - Build command: `cd apps/web && npm ci && npm run build`
   - Build output directory: `apps/web/dist`
3. Set environment variables:
   - `VITE_API_BASE_URL=https://api.eventmaster.com`
4. Configure custom domain

### Backend Deployment (AWS ECS Fargate)

**Deployment via GitHub Actions**:
- CI/CD workflow: `.github/workflows/deploy-api.yml`
- Triggered on push to `main` (API changes)
- Builds Docker image and deploys to ECS

**Manual Deployment Steps**:
1. Build Docker image:
```bash
cd apps/api
docker build -t eventmaster-api .
```

2. Tag and push to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag eventmaster-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/eventmaster-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/eventmaster-api:latest
```

3. Update ECS service:
```bash
aws ecs update-service --cluster eventmaster-cluster --service eventmaster-api --force-new-deployment
```

**Production Checklist**:
- [ ] Change `SECRET_KEY` to strong random value
- [ ] Use PostgreSQL database (not SQLite)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Review security settings
- [ ] Set up rate limiting

---

## Common Development Tasks

### Adding a New API Endpoint

1. **Define Pydantic Schema** (`apps/api/src/schemas/`)
```python
class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    capacity: int = Field(..., ge=1)
```

2. **Create Route** (`apps/api/src/routes/`)
```python
@router.post("/events", response_model=EventResponse)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    # Business logic
    pass
```

3. **Update OpenAPI Spec** (`docs/openapi.yaml`)

4. **Write Tests** (`apps/api/tests/`)
```python
def test_create_event(client, organizer_user):
    response = client.post(
        "/events",
        headers={"Authorization": f"Bearer {organizer_user.token}"},
        json={"title": "Test Event", "capacity": 100, ...}
    )
    assert response.status_code == 201
```

### Adding a New React Page

1. **Create Page Component** (`apps/web/pages/NewPage.tsx`)
```typescript
export const NewPage: React.FC = () => {
  return <div>New Page Content</div>;
};
```

2. **Add Route** (`apps/web/App.tsx`)
```typescript
<Route
  path="/new-page"
  element={
    <ProtectedRoute allowedRoles={['member', 'organizer', 'admin']}>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

3. **Update Navigation** (if needed) (`apps/web/components/Navbar.tsx`)

4. **Write Tests** (`apps/web/__tests__/pages/NewPage.test.tsx`)

### Adding a New Database Model

1. **Define SQLAlchemy Model** (`apps/api/src/models/`)
```python
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    message = Column(String, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

2. **Create Pydantic Schemas** (`apps/api/src/schemas/`)
```python
class NotificationResponse(BaseModel):
    id: str
    message: str
    read: bool

    class Config:
        from_attributes = True
```

3. **Generate Migration** (if using Alembic)
```bash
alembic revision --autogenerate -m "Add notifications table"
alembic upgrade head
```

4. **Update Seed Data** (if needed) (`apps/api/seed_data.py`)

### Infrastructure with Terraform

**File Structure**:
```
infra/terraform/
├── modules/           # Reusable Terraform modules
│   ├── vpc/          # VPC, subnets, NAT gateway
│   ├── ecs/          # ECS cluster, service, task definition
│   ├── rds/          # RDS PostgreSQL instance
│   ├── cognito/      # Cognito User Pool, app client, groups
│   ├── secrets/      # Secrets Manager secrets
│   └── iam/          # IAM roles and policies
└── environments/
    └── dev/          # Dev environment configuration
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        └── terraform.tfvars
```

**Terraform Workflow**:
```bash
# Navigate to environment
cd infra/terraform/environments/dev

# Initialize (required after adding new modules)
terraform init

# Preview changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# View outputs
terraform output

# Destroy (caution!)
terraform destroy
```

**Module Usage Pattern**:
```hcl
# infra/terraform/environments/dev/main.tf
module "cognito" {
  source = "../../modules/cognito"

  environment    = var.environment
  user_pool_name = "eventmaster-${var.environment}"
  callback_urls  = ["https://example.com/callback"]
  logout_urls    = ["https://example.com/logout"]
}
```

**Terraform Conventions**:
1. **Always use modules** - No resources directly in environment files
2. **Use variables** - All configurable values as variables with defaults
3. **Expose outputs** - Export all values other modules/environments need
4. **State management** - Use S3 backend for state (not local)
5. **Naming convention** - `resourcetype-project-environment` (e.g., `eventmaster-rds-dev`)

**Adding New AWS Resources**:
1. Create module in `infra/terraform/modules/<resource>/`
2. Define `main.tf`, `variables.tf`, `outputs.tf`
3. Integrate module in `infra/terraform/environments/dev/main.tf`
4. Run `terraform init` to load new module
5. Run `terraform plan` to preview changes
6. Run `terraform apply` to deploy

### Debugging Common Issues

**Issue: CORS Error in Browser**
```python
# apps/api/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Issue: JWT Token Expired**
```python
# apps/api/src/core/config.py
class Settings(BaseSettings):
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Increase if needed
```

**Issue: Database Not Found**
```bash
# Re-run seed script
cd apps/api
python seed_data.py
```

**Issue: Frontend Not Connecting to Backend**
```typescript
// apps/web/.env.local
VITE_API_BASE_URL=http://localhost:8000
```

---

## Project Constitution

EventMaster follows a set of **non-negotiable principles** defined in `.specify/memory/constitution.md`. All code must comply with these principles:

### Core Principles (Summary)

1. **Interface-Driven Development**
   - Define interfaces before implementation
   - Backend: Abstract base classes / Protocol classes
   - Frontend: TypeScript interfaces for all props and data models

2. **Branch-Based Development** (NON-NEGOTIABLE)
   - All features on dedicated branches
   - No direct commits to main
   - Branch naming: `feature/###-description` or `fix/###-description`

3. **Comprehensive Error Handling**
   - Use HTTPException with appropriate status codes (backend)
   - Implement error boundaries (frontend)
   - Handle success, error, and loading states for all API calls
   - Log errors with context

4. **Test-Driven Quality**
   - Tests mandatory for all critical paths
   - Backend: pytest for unit, integration, API tests
   - Frontend: Vitest/Jest + React Testing Library
   - ≥80% coverage for critical business logic
   - Failing tests block merges

5. **Low Coupling & Clean Code**
   - Single Responsibility Principle
   - Dependency Injection
   - Functions < 50 lines (preferred)
   - Meaningful names (no abbreviations)
   - Follow PEP 8 (Python) and ESLint standards (TypeScript)

### Quality Gates

**Pre-Commit**:
- ✅ Linting passes
- ✅ Formatting applied
- ✅ Type checking passes
- ✅ No console.log/print statements

**Pre-Merge (PR)**:
- ✅ All tests pass
- ✅ Code review approved
- ✅ No merge conflicts
- ✅ Documentation updated (if API changed)
- ✅ No decrease in test coverage

**Pre-Deployment**:
- ✅ Integration tests pass
- ✅ Build succeeds without warnings
- ✅ Security scan passes

---

## AI Assistant Guidelines

### When Working on This Codebase

1. **Always Read Before Writing**
   - NEVER propose changes without reading the file first
   - Use `Read` tool to understand existing code
   - Check related files for context

2. **Follow Branch Workflow**
   - Develop on the specified feature branch: `claude/claude-md-mkcamuow5mzmd4h4-nDeOZ`
   - Commit with clear, conventional commit messages
   - Push to the correct branch when complete

3. **Respect the Constitution**
   - All changes must comply with `.specify/memory/constitution.md`
   - Prioritize: Interface definition → Implementation → Tests
   - Use proper error handling everywhere
   - Keep functions small and focused

4. **Testing is Mandatory**
   - Write tests for new features
   - Update tests when modifying existing code
   - Run tests before committing

5. **Documentation**
   - Update API documentation when endpoints change
   - Update type definitions when data structures change
   - Add JSDoc/docstrings for complex logic
   - Keep CLAUDE.md (this file) up-to-date

6. **Code Review Mindset**
   - Write code as if someone else will review it (they will!)
   - Add comments for "why", not "what"
   - Prefer readability over cleverness
   - No premature optimization

### Common Patterns to Follow

**Backend Route Pattern**:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/resource", tags=["Resource"])

@router.post("", response_model=ResourceResponse)
def create_resource(
    data: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate business logic
    # 2. Check permissions
    # 3. Create resource
    # 4. Commit to DB
    # 5. Return response
    pass
```

**Frontend API Call Pattern**:
```typescript
const [data, setData] = useState<Resource | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await api.getResource();
    setData(response);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setLoading(false);
  }
};
```

### What NOT to Do

- ❌ Don't commit directly to `main` branch
- ❌ Don't use `any` type in TypeScript
- ❌ Don't skip error handling
- ❌ Don't create files without interfaces/types
- ❌ Don't write code without tests for critical paths
- ❌ Don't expose internal errors to end users
- ❌ Don't use print() or console.log() for production code
- ❌ Don't create abstractions prematurely
- ❌ Don't break existing tests without fixing them

### Helpful Commands

```bash
# Frontend
cd apps/web
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests

# Backend
cd apps/api
source venv/bin/activate     # Activate venv
uvicorn main:app --reload    # Start dev server
pytest                       # Run tests
python seed_data.py          # Reset database

# Git
git status
git checkout -b feature/###-name
git add .
git commit -m "feat: Description"
git push -u origin feature/###-name
```

### Reference Files

When working on specific features, consult:

- **API Spec**: `docs/openapi.yaml`
- **Backend Architecture**: `docs/BACKEND_ARCHITECTURE.md`
- **Frontend Architecture**: `docs/FRONTEND_ARCH.md`
- **Product Requirements**: `docs/MVP_SPEC.md`
- **Project Principles**: `.specify/memory/constitution.md`
- **This Guide**: `CLAUDE.md`

---

## Frequently Asked Questions

**Q: How do I add a new user role?**
A: Update the `UserRole` enum in `apps/api/src/models/user.py`, update schemas, adjust RBAC checks in `apps/api/src/core/deps.py`, and update the frontend role checks.

**Q: How do I change the JWT token expiration?**
A: Edit `ACCESS_TOKEN_EXPIRE_MINUTES` in `apps/api/.env` or `apps/api/src/core/config.py`.

**Q: How do I switch from Mock API to real API?**
A: Replace `apps/web/services/mockApi.ts` with real `axios` or `fetch` calls to the backend API. Set `VITE_API_BASE_URL` in `.env.local`.

**Q: How do I add a new event field?**
A: Update the `Event` model, schema, TypeScript interface, and database (run migration if needed).

**Q: Can I use Redux instead of Context API?**
A: Per the constitution, use Context API first. Only introduce Redux if Context becomes insufficient.

**Q: How do I debug authentication issues?**
A: Check: 1) Token in localStorage, 2) Authorization header format, 3) Token expiration, 4) CORS settings, 5) Backend logs.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-13 | Initial comprehensive documentation for AI assistants |

---

## Contributing

When contributing to this codebase:

1. Read this document thoroughly
2. Understand the project constitution
3. Follow the branch workflow
4. Write tests
5. Submit PR with clear description
6. Address review feedback
7. Celebrate when merged! 🎉

---

**End of CLAUDE.md**

For questions or clarifications, refer to:
- `README.md` - Project overview
- `docs/` - Detailed documentation
- `.specify/memory/constitution.md` - Project principles

# EventMaster Architecture

> A comprehensive technical architecture guide for the EventMaster event registration and check-in system.

**Version**: 1.0.0
**Last Updated**: 2026-01-14
**Stack**: React + Vite (Frontend) | FastAPI + SQLAlchemy (Backend)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Data Model](#data-model)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Design](#api-design)
8. [Data Flow Patterns](#data-flow-patterns)
9. [Security Architecture](#security-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Development Guidelines](#development-guidelines)

---

## System Overview

EventMaster is a monorepo-based event registration and check-in system that provides:

- **Event Management**: Create, edit, publish, and manage events
- **Registration System**: User registration with QR code ticket generation
- **Check-in Verification**: QR code scanning and walk-in registration
- **Role-Based Access Control**: Three-tier permission system (member/organizer/admin)

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI components |
| **Build Tool** | Vite 5.x | Fast development & optimized builds |
| **Routing** | React Router v6 | Client-side navigation |
| **State** | Context API | Global state management |
| **Backend** | FastAPI 0.109+ | REST API framework |
| **ORM** | SQLAlchemy 2.0 | Database abstraction |
| **Database** | PostgreSQL / SQLite | Data persistence |
| **Auth** | JWT + bcrypt | Authentication & password hashing |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│                    (Web Browser / Mobile App)                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (SPA)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Pages     │  │ Components  │  │  Contexts   │  │  Services   │    │
│  │  (Views)    │  │    (UI)     │  │   (State)   │  │   (API)     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                         React + TypeScript + Vite                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (JSON)
                                    │ Authorization: Bearer <JWT>
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (API)                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Routes    │  │   Schemas   │  │   Models    │  │    Core     │    │
│  │ (Endpoints) │  │(Validation) │  │   (ORM)     │  │  (Auth/DI)  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                         FastAPI + SQLAlchemy                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SQL
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE                                       │
│                    PostgreSQL (prod) / SQLite (dev)                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Directory Structure

```
apps/web/
├── components/              # Reusable UI components
│   ├── Navbar.tsx          # Navigation with role-based rendering
│   └── ProtectedRoute.tsx  # Route guard for auth & RBAC
├── contexts/               # Global state management
│   └── AuthContext.tsx     # User auth state & persistence
├── pages/                  # Route components (views)
│   ├── Login.tsx           # Authentication page
│   ├── Events.tsx          # Event listing
│   ├── EventDetail.tsx     # Event details & registration
│   ├── MyTickets.tsx       # User's tickets with QR codes
│   ├── OrganizerVerify.tsx # Ticket verification
│   └── Admin*.tsx          # Admin management pages
├── services/               # API integration layer
│   └── mockApi.ts          # API service (mock → real)
├── types.ts                # TypeScript type definitions
├── App.tsx                 # Root component & routing
└── index.tsx               # Entry point
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   AuthProvider                       │    │
│  │  ┌───────────────────────────────────────────────┐  │    │
│  │  │                 HashRouter                     │  │    │
│  │  │  ┌─────────────────────────────────────────┐  │  │    │
│  │  │  │                Navbar                    │  │  │    │
│  │  │  └─────────────────────────────────────────┘  │  │    │
│  │  │  ┌─────────────────────────────────────────┐  │  │    │
│  │  │  │              Routes                      │  │  │    │
│  │  │  │  ┌───────────────────────────────────┐  │  │  │    │
│  │  │  │  │       ProtectedRoute              │  │  │  │    │
│  │  │  │  │  ┌─────────────────────────────┐  │  │  │  │    │
│  │  │  │  │  │      Page Component         │  │  │  │  │    │
│  │  │  │  │  └─────────────────────────────┘  │  │  │  │    │
│  │  │  │  └───────────────────────────────────┘  │  │  │    │
│  │  │  └─────────────────────────────────────────┘  │  │    │
│  │  └───────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### State Management

**AuthContext Pattern**:

```typescript
// contexts/AuthContext.tsx
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

**State Flow**:
1. User logs in → Token stored in localStorage + Context
2. Page reload → Token restored from localStorage
3. Token validated → User state populated
4. Logout → Clear localStorage + Context

### Routing Structure

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | Events | Public | Event listing |
| `/login` | Login | Guest only | Authentication |
| `/events/:id` | EventDetail | Public | Event details |
| `/my-tickets` | MyTickets | Member+ | User's registrations |
| `/organizer/verify` | OrganizerVerify | Organizer+ | Ticket verification |
| `/admin/events/new` | AdminCreateEvent | Organizer+ | Create event |
| `/admin/users` | AdminUsers | Admin | User management |

### API Service Layer

```typescript
// services/api.ts (pattern)
class ApiService {
  private baseUrl: string;
  private token: string | null;

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.json());
    }

    return response.json();
  }
}
```

### Type Definitions

```typescript
// types.ts
enum UserRole {
  MEMBER = 'member',
  ORGANIZER = 'organizer',
  ADMIN = 'admin',
}

interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  startAt: string;      // ISO 8601
  endAt: string;        // ISO 8601
  location: string;
  capacity: number;
  registeredCount: number;
  status: EventStatus;
}

interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;   // Denormalized
  eventStartAt: string; // Denormalized
  userId: string;
  status: RegistrationStatus;
  qrCode: string;
  createdAt: string;
}
```

---

## Backend Architecture

### Directory Structure

```
apps/api/
├── src/
│   ├── core/               # Core utilities
│   │   ├── config.py      # Environment configuration
│   │   ├── security.py    # JWT & password utilities
│   │   ├── deps.py        # FastAPI dependencies
│   │   ├── logging.py     # Logging configuration
│   │   └── sanitize.py    # Input sanitization
│   ├── models/            # SQLAlchemy ORM models
│   │   ├── user.py        # User model
│   │   ├── event.py       # Event model
│   │   └── registration.py # Registration model
│   ├── schemas/           # Pydantic schemas
│   │   ├── auth.py        # Auth request/response
│   │   ├── user.py        # User schemas
│   │   ├── event.py       # Event schemas
│   │   ├── registration.py # Registration schemas
│   │   └── checkin.py     # Check-in schemas
│   ├── routes/            # API endpoints
│   │   ├── auth.py        # Authentication routes
│   │   ├── events.py      # Event CRUD
│   │   ├── registrations.py # Registration management
│   │   ├── checkin.py     # Verification & walk-in
│   │   └── users.py       # User management
│   └── database.py        # Database configuration
├── main.py                # Application entry point
├── seed_data.py           # Database seeding
└── requirements.txt       # Python dependencies
```

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Routes Layer                             │
│  • Request/response handling                                 │
│  • Input validation (Pydantic schemas)                       │
│  • Response serialization                                    │
│  • Dependency injection                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
│  • Authentication (JWT verification)                         │
│  • Authorization (RBAC checks)                               │
│  • Business rule validation                                  │
│  • Data transformation                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│  • SQLAlchemy ORM models                                     │
│  • Database queries                                          │
│  • Relationships & constraints                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│             PostgreSQL (prod) / SQLite (dev)                 │
└─────────────────────────────────────────────────────────────┘
```

### Route Pattern

```python
# routes/events.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    """Create a new event."""
    # 1. Validate input (automatic via Pydantic)
    # 2. Check authorization (handled by dependency)
    # 3. Execute business logic
    event = Event(
        id=str(uuid.uuid4()),
        organizer_id=current_user.id,
        **event_data.model_dump(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    # 4. Return response (automatic serialization)
    return event
```

### Dependency Injection

```python
# core/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

security = HTTPBearer()

def get_db():
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate current user from JWT."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

def require_role(*roles: str):
    """Factory for role-based authorization."""
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dependency

# Convenience dependencies
require_admin = require_role("admin")
require_organizer_or_admin = require_role("organizer", "admin")
```

### Configuration Management

```python
# core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./eventmaster.db"

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    # Application
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

---

## Data Model

### Entity Relationship Diagram

```
┌──────────────────┐         ┌──────────────────┐
│      users       │         │      events      │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │◄───────┐│ id (PK)          │
│ email (UQ, IDX)  │        ││ organizer_id (FK)├──┘
│ hashed_password  │        │├ title            │
│ display_name     │        ││ description      │
│ role (enum)      │        ││ start_at (IDX)   │
│ created_at       │        ││ end_at           │
└──────────────────┘        ││ location         │
        │                   ││ capacity         │
        │ 1:N               ││ registered_count │
        │                   ││ status (enum)    │
        ▼                   │└──────────────────┘
┌──────────────────┐        │        │
│  registrations   │        │        │ 1:N
├──────────────────┤        │        │
│ id (PK)          │        │        ▼
│ event_id (FK,IDX)├────────┴────────┘
│ user_id (FK,IDX) ├─────────────────┘
│ status (enum)    │
│ qr_code (UQ,IDX) │
│ created_at       │
│ event_title      │  ◄── Denormalized
│ event_start_at   │  ◄── Denormalized
└──────────────────┘

Indexes:
- users: email (unique)
- events: organizer_id, start_at
- registrations: event_id, user_id, qr_code (unique)
- registrations: (event_id, user_id) composite for duplicate prevention
```

### SQLAlchemy Models

```python
# models/user.py
from sqlalchemy import Column, String, Enum
from sqlalchemy.orm import relationship
import enum

class UserRole(str, enum.Enum):
    MEMBER = "member"
    ORGANIZER = "organizer"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER)

    # Relationships
    organized_events = relationship("Event", back_populates="organizer")
    registrations = relationship("Registration", back_populates="user")
```

```python
# models/event.py
class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True)
    organizer_id = Column(String, ForeignKey("users.id"), index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(2000))
    start_at = Column(DateTime, index=True, nullable=False)
    end_at = Column(DateTime, nullable=False)
    location = Column(String(500))
    capacity = Column(Integer, nullable=False)
    registered_count = Column(Integer, default=0)
    status = Column(Enum(EventStatus), default=EventStatus.PENDING)

    # Relationships
    organizer = relationship("User", back_populates="organized_events")
    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")
```

```python
# models/registration.py
class Registration(Base):
    __tablename__ = "registrations"

    id = Column(String, primary_key=True)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status = Column(Enum(RegistrationStatus), default=RegistrationStatus.REGISTERED)
    qr_code = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Denormalized fields for query performance
    event_title = Column(String)
    event_start_at = Column(DateTime)

    # Relationships
    event = relationship("Event", back_populates="registrations")
    user = relationship("User", back_populates="registrations")

    __table_args__ = (
        Index("ix_registration_event_user", "event_id", "user_id", unique=True),
    )
```

---

## Authentication & Authorization

### Authentication Flow

```
┌──────────┐      POST /auth/login       ┌──────────┐
│  Client  │ ─────────────────────────▶ │   API    │
│          │   {email, password}         │          │
└──────────┘                             └──────────┘
                                              │
                                              │ 1. Validate credentials
                                              │ 2. Verify password hash
                                              │ 3. Generate JWT
                                              ▼
┌──────────┐      200 OK                 ┌──────────┐
│  Client  │ ◀───────────────────────── │   API    │
│          │   {user, accessToken}       │          │
└──────────┘                             └──────────┘
     │
     │ Store token (localStorage)
     ▼
┌──────────┐   GET /events (protected)   ┌──────────┐
│  Client  │ ─────────────────────────▶ │   API    │
│          │   Authorization: Bearer     │          │
└──────────┘   <token>                   └──────────┘
                                              │
                                              │ 1. Extract token
                                              │ 2. Verify signature
                                              │ 3. Check expiration
                                              │ 4. Load user
                                              │ 5. Check permissions
                                              ▼
```

### JWT Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-id-uuid",
    "exp": 1705276800,
    "iat": 1705275000
  },
  "signature": "..."
}
```

### Role-Based Access Control (RBAC)

**Role Hierarchy**:
```
Admin (highest)
  └── Organizer
        └── Member (lowest)
```

**Permission Matrix**:

| Endpoint | Member | Organizer | Admin |
|----------|--------|-----------|-------|
| View events | ✓ | ✓ | ✓ |
| Register for event | ✓ | ✓ | ✓ |
| View own tickets | ✓ | ✓ | ✓ |
| Create event | ✗ | ✓ | ✓ |
| Edit own event | ✗ | ✓ | ✓ |
| Verify tickets | ✗ | ✓ (own) | ✓ (all) |
| Walk-in registration | ✗ | ✓ (own) | ✓ (all) |
| Manage users | ✗ | ✗ | ✓ |
| Approve events | ✗ | ✗ | ✓ |

---

## API Design

### RESTful Endpoints

```
Authentication:
  POST   /auth/login              # Login, returns JWT
  GET    /auth/me                 # Get current user

Events:
  GET    /events                  # List published events
  GET    /events/managed          # List user's managed events
  POST   /events                  # Create event (organizer+)
  GET    /events/{id}             # Get event details
  PATCH  /events/{id}             # Update event
  DELETE /events/{id}             # Delete event

Registrations:
  POST   /events/{id}/registrations  # Register for event
  GET    /events/{id}/attendees      # Get attendees (organizer+)
  GET    /me/registrations           # Get user's registrations
  DELETE /registrations/{id}         # Cancel registration

Check-in:
  POST   /verify                  # Verify QR code & check-in
  POST   /walk-in                 # Walk-in registration

Users (Admin):
  GET    /users                   # List all users
  PATCH  /users/{id}/role         # Update user role
```

### Request/Response Schemas

```python
# schemas/event.py
class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    start_at: datetime
    end_at: datetime
    location: str = Field(..., max_length=500)
    capacity: int = Field(..., ge=1, le=10000)

    @field_validator("end_at")
    def end_after_start(cls, v, info):
        if info.data.get("start_at") and v <= info.data["start_at"]:
            raise ValueError("end_at must be after start_at")
        return v

class EventResponse(BaseModel):
    id: str
    organizer_id: str
    title: str
    description: str
    start_at: datetime
    end_at: datetime
    location: str
    capacity: int
    registered_count: int
    status: EventStatus

    model_config = ConfigDict(from_attributes=True)
```

### Error Response Format

```json
{
  "detail": "Event not found"
}
```

Or with validation errors:

```json
{
  "detail": [
    {
      "loc": ["body", "capacity"],
      "msg": "ensure this value is greater than or equal to 1",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE |
| 400 | Business logic error |
| 401 | Missing/invalid authentication |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate registration) |
| 422 | Validation error |
| 500 | Server error |

---

## Data Flow Patterns

### Event Registration Flow

```
┌────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│ Client │     │  Route  │     │ Service │     │ Database │
└────┬───┘     └────┬────┘     └────┬────┘     └────┬─────┘
     │              │               │               │
     │ POST /events/{id}/registrations              │
     │──────────────▶               │               │
     │              │               │               │
     │              │ Validate JWT  │               │
     │              │───────────────▶               │
     │              │               │               │
     │              │ Check event exists            │
     │              │───────────────────────────────▶
     │              │               │               │
     │              │ Verify capacity               │
     │              │               │◀──────────────│
     │              │               │               │
     │              │ Check no duplicate            │
     │              │───────────────────────────────▶
     │              │               │               │
     │              │ Create registration           │
     │              │───────────────────────────────▶
     │              │               │               │
     │              │ Increment registered_count    │
     │              │───────────────────────────────▶
     │              │               │               │
     │ 201 Created + RegistrationResponse           │
     │◀──────────────               │               │
     │              │               │               │
```

### Check-in Verification Flow

```
┌───────────┐     ┌─────────┐     ┌──────────┐
│ Organizer │     │   API   │     │ Database │
└─────┬─────┘     └────┬────┘     └────┬─────┘
      │                │               │
      │ POST /verify   │               │
      │ {qr_code}      │               │
      │────────────────▶               │
      │                │               │
      │                │ Find registration by QR
      │                │───────────────▶
      │                │               │
      │                │ Verify event ownership
      │                │◀──────────────│
      │                │               │
      │                │ Check status != CHECKED_IN
      │                │               │
      │                │ Update status to CHECKED_IN
      │                │───────────────▶
      │                │               │
      │ 200 OK         │               │
      │ {success, attendee}            │
      │◀───────────────│               │
      │                │               │
```

---

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Transport Layer                           │
│                  HTTPS (TLS 1.3+)                           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  • CORS policy (whitelisted origins)                        │
│  • Rate limiting                                             │
│  • Request size limits                                       │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Authentication Layer                       │
│  • JWT verification (HS256)                                  │
│  • Token expiration (30 min)                                 │
│  • Password hashing (bcrypt)                                 │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Authorization Layer                        │
│  • Role-based access control (RBAC)                         │
│  • Resource ownership verification                           │
│  • Permission matrix enforcement                             │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Validation Layer                          │
│  • Input sanitization (XSS prevention)                       │
│  • Schema validation (Pydantic)                              │
│  • SQL injection prevention (ORM)                            │
└─────────────────────────────────────────────────────────────┘
```

### Security Measures

| Threat | Mitigation |
|--------|------------|
| **SQL Injection** | SQLAlchemy ORM with parameterized queries |
| **XSS** | Input sanitization, Content-Type headers |
| **CSRF** | JWT in Authorization header (not cookies) |
| **Credential Theft** | bcrypt hashing, no plaintext storage |
| **Token Theft** | Short expiration, HTTPS only |
| **Brute Force** | Rate limiting, account lockout |
| **Information Leakage** | Generic error messages |

---

## Deployment Architecture

### Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CDN / Edge                              │
│                   Cloudflare Pages                           │
│              (Static assets, caching)                        │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (SPA)                            │
│                    React + Vite                              │
│              apps/web/dist (static files)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS API calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Load Balancer                              │
│                   (AWS ALB)                                  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Backend Cluster                            │
│                  AWS ECS Fargate                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Container  │  │  Container  │  │  Container  │         │
│  │  (FastAPI)  │  │  (FastAPI)  │  │  (FastAPI)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Database                                │
│                   AWS RDS PostgreSQL                         │
│              (Multi-AZ, automated backups)                   │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| **Development** | localhost:5173 | localhost:8000 | SQLite |
| **Staging** | staging.eventmaster.com | api-staging.eventmaster.com | PostgreSQL |
| **Production** | eventmaster.com | api.eventmaster.com | PostgreSQL (Multi-AZ) |

---

## Development Guidelines

### Code Organization Principles

1. **Separation of Concerns**
   - Routes handle HTTP concerns only
   - Business logic in dedicated functions
   - Data access through ORM models

2. **Single Responsibility**
   - Each module has one clear purpose
   - Functions do one thing well
   - Keep files focused and small

3. **Dependency Injection**
   - Use FastAPI's `Depends()` system
   - Inject database sessions
   - Inject authenticated users

### Testing Pyramid

```
        ┌─────────────┐
        │   E2E Tests │  ← Few, critical user journeys
        │  (Cypress)  │
        └──────┬──────┘
               │
       ┌───────┴───────┐
       │ Integration   │  ← API endpoint tests
       │   Tests       │
       └───────┬───────┘
               │
    ┌──────────┴──────────┐
    │     Unit Tests      │  ← Most tests, fastest
    │  (pytest / Vitest)  │
    └─────────────────────┘
```

### Error Handling Pattern

**Backend**:
```python
from fastapi import HTTPException, status

# Specific error with appropriate status
if not event:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Event not found"
    )

# Business logic error
if event.registered_count >= event.capacity:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Event is at full capacity"
    )
```

**Frontend**:
```typescript
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  try {
    setLoading(true);
    setError(null);
    await api.registerForEvent(eventId);
  } catch (err) {
    setError(err instanceof ApiError ? err.message : 'An error occurred');
  } finally {
    setLoading(false);
  }
};
```

---

## Appendix

### Quick Reference

**Start Development**:
```bash
# Frontend
cd apps/web && npm install && npm run dev

# Backend
cd apps/api && pip install -r requirements.txt && uvicorn main:app --reload
```

**Run Tests**:
```bash
# Frontend
cd apps/web && npm test

# Backend
cd apps/api && pytest
```

**Key Files**:
- Frontend entry: `apps/web/src/App.tsx`
- Backend entry: `apps/api/main.py`
- API docs: `http://localhost:8000/docs`
- Type definitions: `apps/web/src/types.ts`
- Database models: `apps/api/src/models/`

---

*This document serves as the single source of truth for EventMaster's technical architecture. Keep it updated as the system evolves.*

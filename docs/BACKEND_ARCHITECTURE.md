# EventMaster Backend Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Design Patterns](#api-design-patterns)
6. [Authentication & Authorization](#authentication--authorization)
7. [Core Components](#core-components)
8. [Data Flow](#data-flow)
9. [Security Considerations](#security-considerations)
10. [Design Decisions](#design-decisions)

---

## System Overview

EventMaster backend is a RESTful API built with **FastAPI** and **SQLAlchemy ORM**, providing a complete event management, registration, and check-in system with role-based access control.

### Key Features

- **JWT Authentication** - Stateless token-based authentication
- **Role-Based Access Control (RBAC)** - Three-tier permission system
- **Event Management** - Full CRUD operations for events
- **Event Approval Workflow** - PENDING → PUBLISHED/REJECTED transitions
- **Registration System** - QR code-based ticket generation
- **Check-in Verification** - QR scanning and walk-in registration
- **User Management** - Admin panel for role assignment

### Architecture Principles

- **Layered Architecture** - Clear separation of concerns
- **Dependency Injection** - FastAPI's dependency system for clean code
- **Type Safety** - Pydantic models for validation
- **Scalability** - Stateless design for horizontal scaling
- **Security First** - JWT tokens, password hashing, RBAC

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│              (Frontend / Mobile / CLI)                   │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    API Layer (Routes)                    │
│   ┌──────────┬──────────┬──────────┬──────────┬────┐   │
│   │  Auth    │  Events  │  Regis   │ Check-in │User│   │
│   └──────────┴──────────┴──────────┴──────────┴────┘   │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Domain Layer (Services)                   │
│   ┌──────────────────────────────────────────────────┐  │
│   │ EventApproval │ Walk-in Registration │ Validation │  │
│   └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Data Access Layer (ORM Models)              │
│   ┌──────────────────────────────────────────────────┐  │
│   │    User Model   │  Event Model  │  Registration │  │
│   └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Database Layer                         │
│              (PostgreSQL / SQLite)                       │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. **Routes Layer** (`src/routes/`)
- HTTP request/response handling
- Input validation (via Pydantic schemas)
- Dependency injection
- Response serialization
- Error handling

#### 2. **Domain Layer** (`src/domain/`)
- Event approval workflow and status transitions
- Walk-in registration logic
- Logging of approval actions

#### 3. **Business Logic Layer** (`src/core/`)
- Authentication logic (JWT generation/verification)
- Authorization checks (RBAC)
- Password hashing
- Business rules enforcement

#### 4. **Data Access Layer** (`src/models/`)
- ORM model definitions
- Database relationships
- Data constraints
- Query methods

#### 5. **Validation Layer** (`src/schemas/`)
- Request/response schemas
- Data type validation
- Field constraints
- Serialization rules

---

## Technology Stack

### Core Framework
- **FastAPI** (0.109.0) - Modern, fast web framework
- **Uvicorn** (0.27.0) - ASGI server
- **Python 3.11+** - Runtime

### Database
- **SQLAlchemy** (2.0.25) - ORM for database operations
- **Alembic** (1.13.1) - Database migrations
- **PostgreSQL** (Production) - Primary database
- **SQLite** (Development) - Local development database

### Authentication & Security
- **python-jose** (3.3.0) - JWT token generation
- **passlib** (1.7.4) - Password hashing with bcrypt
- **python-dotenv** (1.0.0) - Environment configuration

### Validation & Serialization
- **Pydantic** (2.5.3) - Data validation
- **pydantic-settings** (2.1.0) - Settings management
- **email-validator** (2.1.0) - Email validation

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ id (PK)         │
│ email           │◄────┐
│ hashed_password │     │
│ display_name    │     │
│ role            │     │
└─────────────────┘     │
        │               │
        │ 1:N           │ N:1
        ▼               │
┌─────────────────┐     │
│     Event       │     │
├─────────────────┤     │
│ id (PK)         │     │
│ organizer_id(FK)├─────┘
│ title           │
│ description     │
│ start_at        │
│ end_at          │
│ location        │
│ capacity        │
│ registered_count│
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────┐
│   Registration      │
├─────────────────────┤
│ id (PK)             │
│ event_id (FK)       │───┐
│ user_id (FK)        │───┤
│ status              │   │
│ qr_code (UNIQUE)    │   │
│ created_at          │   │
│ event_title         │◄──┤ Denormalized
│ event_start_at      │◄──┘ for performance
└─────────────────────┘
```

### Table Definitions

#### **users** Table
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    display_name VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'member'
);
CREATE INDEX idx_users_email ON users(email);
```

**Columns:**
- `id` - Unique user identifier (e.g., "u1", "u2")
- `email` - User email (unique, indexed)
- `hashed_password` - Bcrypt hashed password
- `display_name` - User's display name
- `role` - Enum: `member`, `organizer`, `admin`

#### **events** Table
```sql
CREATE TABLE events (
    id VARCHAR PRIMARY KEY,
    organizer_id VARCHAR NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    start_at TIMESTAMP NOT NULL,
    end_at TIMESTAMP NOT NULL,
    location VARCHAR(200) NOT NULL,
    capacity INTEGER NOT NULL,
    registered_count INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_status ON events(status);
```

**Columns:**
- `id` - Unique event identifier (e.g., "e1", "e2")
- `organizer_id` - Foreign key to users table
- `title` - Event title (max 200 chars)
- `description` - Full event description
- `start_at` - Event start timestamp
- `end_at` - Event end timestamp
- `location` - Event location/venue
- `capacity` - Maximum attendees
- `registered_count` - Current registration count
- `status` - Approval status (`PENDING`, `PUBLISHED`, `REJECTED`)

#### **registrations** Table
```sql
CREATE TABLE registrations (
    id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'registered',
    qr_code VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    event_title VARCHAR(200) NOT NULL,
    event_start_at TIMESTAMP NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_qr_code ON registrations(qr_code);
CREATE INDEX idx_event_user ON registrations(event_id, user_id);
```

**Columns:**
- `id` - Unique registration identifier
- `event_id` - Foreign key to events table
- `user_id` - Foreign key to users table
- `status` - Enum: `registered`, `checked_in`, `cancelled`
- `qr_code` - Unique QR code token for verification
- `created_at` - Registration timestamp
- `event_title` - Denormalized event title
- `event_start_at` - Denormalized event start time

**Indexes:**
- Composite index on (event_id, user_id) for quick duplicate checks
- QR code indexed for fast verification lookups

---

## API Design Patterns

### RESTful Conventions

```
Resource-based URLs:
  GET    /events              - List events
  POST   /events              - Create event
  GET    /events/{id}         - Get event details
  PATCH  /events/{id}         - Update event
  DELETE /events/{id}         - Delete event

Nested resources:
  POST   /events/{id}/registrations  - Register for event
  GET    /events/{id}/attendees      - Get attendees

User-scoped resources:
  GET    /me/registrations    - Get my registrations
```

### HTTP Status Codes

- `200 OK` - Successful GET/PATCH request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Client error (business logic)
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error

### Response Formats

**Success Response:**
```json
{
  "id": "e1",
  "title": "Q1 All-Hands Meeting",
  "organizer_id": "u2",
  "capacity": 200,
  "registered_count": 45
}
```

**Error Response:**
```json
{
  "error": "ValidationError",
  "message": "Invalid input data",
  "details": {
    "capacity": "Must be greater than 0"
  }
}
```

---

## Authentication & Authorization

### JWT Token Flow

```
┌────────┐                                    ┌────────────┐
│ Client │                                    │   Server   │
└────┬───┘                                    └─────┬──────┘
     │                                              │
     │  POST /auth/login                            │
     │  {email, password}                           │
     ├─────────────────────────────────────────────►│
     │                                              │
     │                           1. Verify password │
     │                           2. Generate JWT    │
     │                                              │
     │  {user, access_token}                        │
     │◄─────────────────────────────────────────────┤
     │                                              │
     │  GET /events (protected)                     │
     │  Authorization: Bearer <token>               │
     ├─────────────────────────────────────────────►│
     │                                              │
     │                           1. Verify JWT      │
     │                           2. Extract user_id │
     │                           3. Check permissions│
     │                                              │
     │  {events: [...]}                             │
     │◄─────────────────────────────────────────────┤
     │                                              │
```

### JWT Token Structure

**Payload:**
```json
{
  "sub": "u1",                    // User ID
  "exp": 1699999999,              // Expiration timestamp
  "iat": 1699900000               // Issued at timestamp
}
```

**Token Configuration:**
- Algorithm: HS256
- Expiration: 30 minutes (configurable)
- Secret Key: Loaded from environment

### Role-Based Access Control (RBAC)

#### Role Hierarchy

```
┌────────────────────────────────────────┐
│              admin                     │
│  - All organizer permissions           │
│  - Manage all events                   │
│  - View/edit all registrations         │
│  - Manage user roles                   │
└────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│           organizer                    │
│  - All member permissions              │
│  - Create events                       │
│  - Manage own events                   │
│  - Verify tickets for own events       │
│  - Walk-in registration                │
└────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│             member                     │
│  - View events                         │
│  - Register for events                 │
│  - View own registrations              │
│  - Cancel own registrations            │
└────────────────────────────────────────┘
```

#### Permission Matrix

| Endpoint | Member | Organizer | Admin |
|----------|--------|-----------|-------|
| POST /auth/login | ✓ | ✓ | ✓ |
| GET /events | ✓ | ✓ | ✓ |
| POST /events | ✗ | ✓ | ✓ |
| PATCH /events/{id} | ✗ | ✓ (own) | ✓ (all) |
| DELETE /events/{id} | ✗ | ✓ (own) | ✓ (all) |
| POST /events/{id}/registrations | ✓ | ✓ | ✓ |
| DELETE /registrations/{id} | ✓ (own) | ✓ (own) | ✓ (own) |
| GET /events/{id}/attendees | ✗ | ✓ (own) | ✓ (all) |
| POST /verify | ✗ | ✓ | ✓ |
| POST /walk-in | ✗ | ✓ | ✓ |
| GET /users | ✗ | ✗ | ✓ |
| PATCH /users/{id}/role | ✗ | ✗ | ✓ |

### Authentication Implementation

**Dependencies (src/core/deps.py):**
```python
# Get current user from JWT token
def get_current_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session
) -> User

# Optional authentication (allows unauthenticated)
def get_current_user_optional(...) -> Optional[User]

# Require specific roles
def require_role(*allowed_roles: UserRole)

# Convenience dependencies
require_admin = require_role(UserRole.ADMIN)
require_organizer_or_admin = require_role(UserRole.ORGANIZER, UserRole.ADMIN)
```

**Usage in Routes:**
```python
@router.post("/events", dependencies=[Depends(require_organizer_or_admin)])
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only organizers and admins can reach here
    pass
```

---

## Core Components

### 1. Configuration (`src/core/config.py`)

**Purpose:** Centralized configuration management using Pydantic Settings

**Key Settings:**
- Database URL
- JWT secret key and algorithm
- CORS allowed origins
- Token expiration time
- Environment (dev/staging/prod)

**Example:**
```python
class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
```

### 2. Security (`src/core/security.py`)

**Purpose:** Authentication and password management

**Functions:**
- `verify_password()` - Compare plain text with hash
- `get_password_hash()` - Hash password with bcrypt
- `create_access_token()` - Generate JWT token
- `decode_access_token()` - Verify and decode JWT

**Password Hashing:**
- Algorithm: Bcrypt
- Rounds: 12 (default)
- Salt: Auto-generated per password

### 3. Database (`src/database.py`)

**Purpose:** Database connection and session management

**Components:**
- `engine` - SQLAlchemy database engine
- `SessionLocal` - Session factory
- `Base` - Declarative base for models
- `get_db()` - Dependency for route injection
- `init_db()` - Initialize database tables

**Session Pattern:**
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 4. Domain Services (`src/domain/`)

**Purpose:** Centralize approval and walk-in business rules

**Key Services:**
- `EventApprovalService` - Pending list, approve/reject transitions, audit logs
- `WalkInService` - Walk-in registration with status + capacity validation

### 5. Models (`src/models/`)

**Purpose:** SQLAlchemy ORM model definitions

**Key Features:**
- Type hints for IDE support
- Relationship definitions
- Property methods for computed fields
- Cascade delete rules

**Example:**
```python
class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True)
    capacity = Column(Integer, nullable=False)
    registered_count = Column(Integer, default=0)

    # Relationships
    registrations = relationship("Registration", cascade="all, delete-orphan")

    # Computed properties
    @property
    def is_full(self) -> bool:
        return self.registered_count >= self.capacity
```

### 6. Schemas (`src/schemas/`)

**Purpose:** Pydantic models for validation and serialization

**Types:**
- **Request schemas** - Validate incoming data
- **Response schemas** - Serialize outgoing data
- **Update schemas** - Partial updates with Optional fields

**Example:**
```python
class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    capacity: int = Field(..., ge=1, le=10000)

class EventResponse(EventCreate):
    id: str
    organizer_id: str
    registered_count: int

    class Config:
        from_attributes = True  # Enable ORM mode
```

### 6. Routes (`src/routes/`)

**Purpose:** API endpoint definitions

**Structure:**
- Each file contains related endpoints
- Uses APIRouter for modular organization
- Dependency injection for auth and database
- Type hints for automatic OpenAPI generation

**Example:**
```python
router = APIRouter(prefix="/events", tags=["Events"])

@router.post("", response_model=EventResponse)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    # Business logic here
    pass
```

---

## Data Flow

### Example: Event Registration Flow

```
┌─────────┐                                                          ┌──────────┐
│ Client  │                                                          │  Server  │
└────┬────┘                                                          └─────┬────┘
     │                                                                     │
     │  POST /events/e1/registrations                                     │
     │  Authorization: Bearer <token>                                     │
     ├────────────────────────────────────────────────────────────────────►│
     │                                                                     │
     │                                              1. Verify JWT token   │
     │                                              2. Extract user_id    │
     │                                                                     │
     │                                              3. Check event exists │
     │                                              4. Check capacity     │
     │                                              5. Check duplicates   │
     │                                                                     │
     │                                              6. Create registration│
     │                                              7. Generate QR code   │
     │                                              8. Increment counter  │
     │                                              9. Commit to DB       │
     │                                                                     │
     │  201 Created                                                        │
     │  {id, event_id, user_id, qr_code, status}                          │
     │◄────────────────────────────────────────────────────────────────────┤
     │                                                                     │
```

### Example: QR Code Verification Flow

```
┌──────────┐                                                    ┌──────────┐
│Organizer │                                                    │  Server  │
└────┬─────┘                                                    └─────┬────┘
     │                                                                │
     │  POST /verify                                                  │
     │  Authorization: Bearer <organizer-token>                       │
     │  {qr_code: "QR-e1-u1-1234"}                                    │
     ├────────────────────────────────────────────────────────────────►│
     │                                                                │
     │                                    1. Verify organizer token   │
     │                                    2. Find registration by QR  │
     │                                    3. Check event ownership    │
     │                                    4. Validate status          │
     │                                    5. Update to CHECKED_IN     │
     │                                    6. Commit to DB             │
     │                                                                │
     │  200 OK                                                        │
     │  {success: true, message: "Check-in Successful!", ...}         │
     │◄────────────────────────────────────────────────────────────────┤
     │                                                                │
```

---

## Security Considerations

### 1. Password Security
- **Hashing**: Bcrypt with automatic salting
- **No Plain Text**: Passwords never stored in plain text
- **Rounds**: Configurable work factor (default: 12)

### 2. JWT Security
- **Secret Key**: Must be strong and kept secret
- **Expiration**: Tokens expire after 30 minutes
- **Stateless**: No server-side session storage
- **HTTPS Required**: Tokens should only be transmitted over HTTPS in production

### 3. SQL Injection Prevention
- **ORM**: SQLAlchemy handles parameterization
- **No Raw SQL**: All queries use ORM methods
- **Input Validation**: Pydantic validates all inputs

### 4. CORS Configuration
- **Whitelist**: Only configured origins allowed
- **Credentials**: Allow credentials for authenticated requests
- **Methods/Headers**: Explicit allow lists

### 5. Input Validation
- **Type Checking**: Pydantic enforces types
- **Length Limits**: Max lengths on strings
- **Range Validation**: Min/max on integers
- **Email Validation**: RFC-compliant email checking

### 6. Authorization Checks
- **Resource Ownership**: Users can only modify their own data
- **Event Ownership**: Organizers can only manage their events
- **Admin Override**: Admins have full access
- **Fail-Safe**: Deny by default

### 7. Rate Limiting (Recommended)
- **Per-IP Limits**: Prevent brute force attacks
- **Per-User Limits**: Prevent abuse
- **Endpoint-Specific**: Different limits for different endpoints
- **Implementation**: Consider using `slowapi` or similar

---

## Design Decisions

### 1. Why FastAPI?

**Chosen:** FastAPI
**Alternatives:** Flask, Django REST Framework

**Rationale:**
- ✅ High performance (Starlette + Pydantic)
- ✅ Automatic OpenAPI documentation
- ✅ Type hints and validation built-in
- ✅ Async support (future scalability)
- ✅ Modern Python 3.11+ features

### 2. Why SQLAlchemy ORM?

**Chosen:** SQLAlchemy ORM
**Alternatives:** Raw SQL, Django ORM, Tortoise ORM

**Rationale:**
- ✅ Database agnostic (SQLite → PostgreSQL)
- ✅ Mature and well-tested
- ✅ Relationship handling
- ✅ Migration support via Alembic
- ✅ Type-safe with proper configuration

### 3. Why JWT Tokens?

**Chosen:** JWT (JSON Web Tokens)
**Alternatives:** Session cookies, OAuth2

**Rationale:**
- ✅ Stateless (horizontal scaling)
- ✅ Works with mobile/SPA
- ✅ Self-contained (no DB lookup)
- ✅ Standard protocol
- ❌ Cannot revoke without additional infrastructure

### 4. Why Denormalized Fields in Registration?

**Design:** Store `event_title` and `event_start_at` in registrations table

**Rationale:**
- ✅ Faster queries (no join needed for "My Tickets" page)
- ✅ Historical accuracy (preserves data if event changes)
- ✅ Better performance at scale
- ❌ Slight data redundancy (acceptable trade-off)

### 5. Why Role-Based vs Attribute-Based Access Control?

**Chosen:** Role-Based Access Control (RBAC)
**Alternative:** Attribute-Based Access Control (ABAC)

**Rationale:**
- ✅ Simpler to implement and understand
- ✅ Sufficient for MVP requirements
- ✅ Easy to audit and debug
- ✅ Can evolve to ABAC later if needed
- Three roles cover all use cases

### 6. Why Composite Index on (event_id, user_id)?

**Design:** Index on both event_id and user_id together

**Rationale:**
- ✅ Fast duplicate registration checks
- ✅ Prevents race conditions
- ✅ Supports both single-column and composite queries
- Performance-critical for registration endpoint

### 7. Why Soft vs Hard Delete?

**Chosen:** Hard delete with CASCADE
**Alternative:** Soft delete (status flag)

**Rationale:**
- ✅ Simpler implementation
- ✅ GDPR compliance (right to be forgotten)
- ✅ No "deleted" data cluttering queries
- ❌ Cannot restore deleted events
- Future: Could add archive system if needed

### 8. Why SQLite for Development?

**Development:** SQLite
**Production:** PostgreSQL

**Rationale:**
- ✅ Zero configuration setup
- ✅ File-based (easy to reset)
- ✅ Fast for local development
- ✅ SQLAlchemy abstracts differences
- Production uses PostgreSQL for:
  - Better concurrency
  - Advanced features
  - Scalability

---

## Deployment Architecture

### Production Recommendations

```
┌──────────────┐
│  CDN/WAF     │  - Cloudflare / AWS CloudFront
└──────┬───────┘
       │
┌──────▼───────┐
│ Load Balancer│  - AWS ALB / nginx
└──────┬───────┘
       │
   ┌───┴────┬─────────┬─────────┐
   ▼        ▼         ▼         ▼
┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
│ API │  │ API │  │ API │  │ API │  - FastAPI containers
└──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
   │        │        │        │
   └────────┴────────┴────────┘
              │
       ┌──────▼───────┐
       │  PostgreSQL  │  - AWS RDS / Self-hosted
       │  (Primary)   │
       └──────┬───────┘
              │
       ┌──────▼───────┐
       │  PostgreSQL  │  - Read replica (optional)
       │  (Replica)   │
       └──────────────┘
```

### Scaling Considerations

**Horizontal Scaling:**
- Stateless design allows multiple API instances
- Load balancer distributes traffic
- Database connection pooling

**Caching Layer (Future):**
- Redis for session cache
- Event list caching
- QR code validation cache

**Database Optimization:**
- Read replicas for heavy read workloads
- Connection pooling
- Query optimization with indexes

---

## Performance Optimizations

### 1. Database Indexes
- Event list by start_at (DESC)
- Registration lookup by QR code
- User lookup by email
- Composite index on (event_id, user_id)

### 2. Denormalization
- Event title/start_at in registrations
- Avoids joins in "My Tickets" queries
- Trade-off: slight data redundancy for speed

### 3. Eager Loading (Future)
- Use `joinedload()` for relationships
- Reduce N+1 query problems
- Example: Loading events with organizer info

### 4. Connection Pooling
- SQLAlchemy's built-in pooling
- Reuse database connections
- Configurable pool size

### 5. Pagination
- Limit query results with offset/limit
- Prevents loading all records
- Improves response time

---

## Testing Strategy (Recommended)

### Unit Tests
```python
# Test password hashing
def test_password_hashing():
    password = "test123"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed)

# Test JWT token
def test_jwt_token():
    token = create_access_token({"sub": "u1"})
    payload = decode_access_token(token)
    assert payload["sub"] == "u1"
```

### Integration Tests
```python
# Test registration flow
def test_register_for_event(client, test_user, test_event):
    response = client.post(
        f"/events/{test_event.id}/registrations",
        headers={"Authorization": f"Bearer {test_user.token}"}
    )
    assert response.status_code == 201
    assert "qr_code" in response.json()
```

### End-to-End Tests
- Test complete user journeys
- Login → Browse events → Register → Check-in
- Test RBAC enforcement
- Test error scenarios

---

## Monitoring & Observability (Recommended)

### Logging
```python
import logging
logger = logging.getLogger(__name__)

# Log important events
logger.info(f"User {user_id} registered for event {event_id}")
logger.error(f"Failed login attempt for {email}")
```

### Metrics
- Request rate (requests/sec)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- Active connections

### Alerting
- High error rate
- Slow response times
- Database connection issues
- Failed authentication attempts

---

## Future Enhancements

### Short Term
- [ ] Alembic migrations for production
- [ ] Rate limiting per endpoint
- [ ] Email notifications for registrations
- [ ] QR code image generation
- [ ] Audit logging

### Medium Term
- [ ] Redis caching layer
- [ ] Search and filtering on events
- [ ] Event categories/tags
- [ ] Waitlist functionality
- [ ] Export attendee lists (CSV/Excel)

### Long Term
- [ ] Microservices architecture
- [ ] Event analytics dashboard
- [ ] Integration with calendar systems
- [ ] Mobile app API
- [ ] Multi-tenancy support

---

## Conclusion

The EventMaster backend is built with scalability, security, and maintainability in mind. The layered architecture, combined with FastAPI's modern features and SQLAlchemy's robust ORM, provides a solid foundation for the event management system.

Key strengths:
- ✅ Clean separation of concerns
- ✅ Type-safe with validation
- ✅ Secure authentication & authorization
- ✅ Well-documented with OpenAPI
- ✅ Easy to test and deploy
- ✅ Scalable architecture

For questions or contributions, please refer to the project repository.

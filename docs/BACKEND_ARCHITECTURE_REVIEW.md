# Backend Architecture Review - FastAPI & SQLAlchemy

**Date**: 2026-01-13
**Reviewer**: Claude Code
**Codebase**: EventMaster API (`apps/api/`)
**Verdict**: ⚠️ **Good Foundation with Important Improvements Needed**

---

## Executive Summary

The FastAPI backend has a **solid foundation** with good separation of concerns (models, schemas, routes, core) and proper use of dependency injection. However, it uses **outdated SQLAlchemy patterns** and lacks several production-ready features. The architecture follows FastAPI conventions but needs modernization for SQLAlchemy 2.0 and better error handling.

**Rating**: 6.5/10
- ✅ Strengths: Clean structure, RBAC, dependency injection, Pydantic validation
- ⚠️ Needs Improvement: SQLAlchemy 2.0 migration, service layer, error handling, testing
- ❌ Critical Issues: Weak UUID generation, missing timestamps, deprecated patterns

---

## 🔴 Critical Issues (Must Fix)

### 1. **Outdated SQLAlchemy 1.x Query Patterns**

**Problem**: Using legacy `db.query(Model)` syntax instead of SQLAlchemy 2.0 style

**Current Code** (`apps/api/src/routes/auth.py:25`):
```python
user = db.query(User).filter(User.email == credentials.email).first()
```

**Best Practice** (SQLAlchemy 2.0):
```python
from sqlalchemy import select

stmt = select(User).where(User.email == credentials.email)
user = db.execute(stmt).scalar_one_or_none()
```

**Why**: SQLAlchemy 2.0 has deprecated the `query()` API. The new style:
- More explicit and composable
- Better type checking support
- Future-proof for SQLAlchemy 2.1+
- Consistent with async patterns

**Impact**: High - Will break in future SQLAlchemy versions
**Effort**: Medium - Affects all 30+ queries across routes
**Files**: All route files (`auth.py`, `events.py`, `registrations.py`, `checkin.py`, `users.py`)

---

### 2. **Weak UUID Generation**

**Problem**: Using only 8 hex characters for IDs

**Current Code** (`apps/api/src/routes/events.py:105`):
```python
id=f"e{uuid.uuid4().hex[:8]}"  # Only 8 chars = 2^32 possible values
```

**Best Practice**:
```python
import uuid

# Option A: Full UUID4 (recommended)
id=str(uuid.uuid4())  # 36 chars: "550e8400-e29b-41d4-a716-446655440000"

# Option B: Use database auto-increment
# models/event.py
from sqlalchemy.dialects.postgresql import UUID
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

# For SQLite compatibility:
id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
```

**Why**:
- 8 hex chars = only 4.3 billion possible IDs → high collision risk
- Full UUID4 = 2^122 possible values → collision probability negligible
- Current approach defeats the purpose of UUIDs

**Impact**: **CRITICAL** - High risk of ID collisions in production
**Effort**: Low - Change 3 lines in event, user, registration creation
**Files**: `routes/events.py`, `routes/registrations.py`, `seed_data.py`

---

### 3. **Deprecated `datetime.utcnow()` Usage**

**Problem**: Using deprecated `datetime.utcnow()` (removed in Python 3.12+)

**Current Code** (`apps/api/src/core/security.py:36,38`):
```python
expire = datetime.utcnow() + expires_delta
```

**Best Practice** (Python 3.11+):
```python
from datetime import datetime, timezone

expire = datetime.now(timezone.utc) + expires_delta
```

**Why**:
- `datetime.utcnow()` is deprecated since Python 3.12
- Returns naive datetime (no timezone info) causing bugs
- Modern approach explicitly uses UTC timezone

**Impact**: High - Code will break on Python 3.12+
**Effort**: Low - 5 minute fix
**Files**: `src/core/security.py:36,38`, `src/models/registration.py:26`

---

### 4. **Missing OpenAPI Alignment**

**Problem**: Response schemas don't match OpenAPI spec

**Current Code** (`apps/api/src/schemas/event.py:42-45`):
```python
class EventListResponse(BaseModel):
    events: list[EventResponse]  # ❌ OpenAPI says "items"
    total: int
```

**OpenAPI Spec** (`docs/openapi.yaml:131`):
```yaml
properties:
  items:  # ✅ OpenAPI standard
    type: array
  total:
    type: integer
  limit:
    type: integer
  offset:
    type: integer
```

**Fix**:
```python
class EventListResponse(BaseModel):
    items: list[EventResponse]  # Match OpenAPI
    total: int
    limit: int
    offset: int
```

**Impact**: High - Breaks API contract with frontend
**Effort**: Low - Rename field + update routes
**Files**: `schemas/event.py`, `schemas/user.py`, all paginated endpoints

---

## 🟡 Important Issues (Should Fix)

### 5. **Outdated SQLAlchemy ORM Model Syntax**

**Problem**: Using old `Column()` syntax instead of modern `Mapped[]` annotations

**Current Code** (`apps/api/src/models/user.py:20-24`):
```python
from sqlalchemy import Column, String, Enum

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER, nullable=False)
```

**Best Practice** (SQLAlchemy 2.0+):
```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from typing import Optional

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    role: Mapped[UserRole] = mapped_column(default=UserRole.MEMBER)
```

**Benefits**:
- Type safety with mypy/pyright
- Clearer nullability (Mapped[str] vs Mapped[Optional[str]])
- Better IDE autocomplete
- Recommended by SQLAlchemy docs

**Impact**: Medium - Better developer experience and type safety
**Effort**: High - Refactor all 3 model files
**Files**: `models/user.py`, `models/event.py`, `models/registration.py`, `database.py`

---

### 6. **Missing Service Layer**

**Problem**: Business logic mixed directly into route handlers

**Current Code** (`apps/api/src/routes/events.py:85-120`):
```python
@router.post("", response_model=EventResponse)
def create_event(event_data: EventCreate, current_user: User, db: Session):
    # 15+ lines of business logic in route handler
    if event_data.end_at <= event_data.start_at:
        raise HTTPException(...)

    event = Event(
        id=f"e{uuid.uuid4().hex[:8]}",
        # ...
    )
    db.add(event)
    db.commit()
    # ...
```

**Best Practice**: Extract to service layer

**Proposed Structure**:
```
apps/api/src/
├── services/
│   ├── __init__.py
│   ├── event_service.py
│   ├── registration_service.py
│   └── user_service.py
```

**Service Layer Example**:
```python
# src/services/event_service.py
class EventService:
    def __init__(self, db: Session):
        self.db = db

    def create_event(self, event_data: EventCreate, organizer_id: str) -> Event:
        """Create a new event with validation"""
        # Business logic here
        self._validate_dates(event_data.start_at, event_data.end_at)

        event = Event(
            id=str(uuid.uuid4()),
            organizer_id=organizer_id,
            **event_data.model_dump()
        )

        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def _validate_dates(self, start: datetime, end: datetime):
        if end <= start:
            raise ValueError("Event end time must be after start time")

# routes/events.py
@router.post("", response_model=EventResponse)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    service = EventService(db)
    try:
        event = service.create_event(event_data, current_user.id)
        return EventResponse.model_validate(event)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
```

**Benefits**:
- Testable business logic (no FastAPI dependencies)
- Reusable across multiple endpoints
- Cleaner route handlers (focus on HTTP concerns)
- Easier to mock for testing
- Better separation of concerns

**Impact**: Medium - Improves maintainability and testability
**Effort**: High - Refactor all route handlers
**Recommendation**: Start with most complex endpoints (registrations, check-in)

---

### 7. **Missing Transaction Error Handling**

**Problem**: No try/except blocks for database operations

**Current Code** (`apps/api/src/routes/events.py:116-118`):
```python
db.add(event)
db.commit()  # What if this fails?
db.refresh(event)
```

**Best Practice**:
```python
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

try:
    db.add(event)
    db.commit()
    db.refresh(event)
except IntegrityError as e:
    db.rollback()
    # Handle unique constraint violations
    if "unique constraint" in str(e).lower():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event with this title already exists"
        )
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Database error occurred"
    )
except SQLAlchemyError as e:
    db.rollback()
    # Log the error
    logger.error(f"Database error: {e}")
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred"
    )
```

**Why**:
- Database operations can fail (constraint violations, connection errors)
- Need to rollback transactions on failure
- Should return appropriate HTTP status codes
- Must log errors for debugging

**Impact**: Medium - Production stability
**Effort**: Medium - Add to all write operations
**Files**: All route files with db.commit()

---

### 8. **Inconsistent Pagination Implementation**

**Problem**: Some endpoints have pagination, others don't (but OpenAPI says they should)

**Current State**:
- ✅ `GET /events` - Has pagination (line 22-34)
- ❌ `GET /events/managed` - No pagination (line 42-60) but OpenAPI says it should
- ❌ `GET /me/registrations` - Likely no pagination
- ❌ `GET /events/{id}/attendees` - No pagination
- ❌ `GET /users` - No pagination

**Fix**: Apply consistent pagination pattern

**Pagination Helper**:
```python
# src/core/pagination.py
from typing import TypeVar, Generic, List
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    limit: int
    offset: int

def paginate(
    db: Session,
    stmt: select,
    limit: int,
    offset: int,
    response_model: type[T]
) -> PaginatedResponse[T]:
    """Apply pagination to a SQLAlchemy select statement"""
    # Get total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar()

    # Get paginated results
    items_stmt = stmt.limit(limit).offset(offset)
    items = db.execute(items_stmt).scalars().all()

    return PaginatedResponse(
        items=[response_model.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset
    )
```

**Impact**: Medium - API consistency
**Effort**: Medium - Update 4-5 endpoints
**Files**: `events.py`, `registrations.py`, `users.py`

---

### 9. **Missing Audit Timestamps**

**Problem**: Models lack `created_at` and `updated_at` timestamps

**Current State**:
- ✅ Registration has `created_at` (line 26)
- ❌ User model - no timestamps
- ❌ Event model - no timestamps

**Best Practice**: Add to all models

```python
from sqlalchemy import Column, DateTime, func

class BaseModel(Base):
    """Base model with audit timestamps"""
    __abstract__ = True

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class User(BaseModel):
    __tablename__ = "users"
    # ... rest of fields
```

**Benefits**:
- Track when records were created/modified
- Essential for debugging
- Required for audit trails
- Support for soft deletes

**Impact**: Medium - Audit trail capability
**Effort**: Low - Add to BaseModel + migration
**Files**: `database.py`, all model files, new migration

---

### 10. **Using Deprecated `@app.on_event` Decorator**

**Problem**: `@app.on_event("startup")` is deprecated in FastAPI 0.109+

**Current Code** (`apps/api/main.py:42-45`):
```python
@app.on_event("startup")
def on_startup():
    """Initialize database on startup"""
    init_db()
```

**Best Practice** (FastAPI 0.93+):
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown (cleanup if needed)
    # await cleanup()

app = FastAPI(lifespan=lifespan, ...)
```

**Why**:
- `@app.on_event` is deprecated
- `lifespan` supports both startup and shutdown
- Works with async operations
- Recommended by FastAPI docs

**Impact**: Low - Deprecation warning
**Effort**: Low - 5 minute fix
**Files**: `main.py:42-45`

---

## 🟢 Minor Issues (Nice to Have)

### 11. **Missing Database Indexes**

**Problem**: Not all foreign keys and frequently queried columns are indexed

**Current State**:
- ✅ Primary keys indexed by default
- ⚠️ Some foreign keys indexed, some not
- ❌ No composite indexes for common queries

**Recommendations**:

```python
# models/registration.py
class Registration(Base):
    # Add these indexes
    __table_args__ = (
        Index('idx_event_user', 'event_id', 'user_id', unique=True),  # Already exists ✅
        Index('idx_user_status', 'user_id', 'status'),  # Add for "my tickets" queries
        Index('idx_event_status', 'event_id', 'status'),  # Add for attendee lists
        Index('idx_qr_code', 'qr_code'),  # Already exists via unique=True ✅
    )

# models/event.py
class Event(Base):
    # Add index for filtering by date range
    __table_args__ = (
        Index('idx_start_at', 'start_at'),  # Already exists ✅
        Index('idx_organizer_start', 'organizer_id', 'start_at'),  # Add for "my events"
    )
```

**Impact**: Low - Performance optimization
**Effort**: Low - Add indexes + migration

---

### 12. **No Logging Configuration**

**Problem**: No structured logging setup

**Recommendation**:
```python
# src/core/logger.py
import logging
from .config import settings

def setup_logging():
    logging.basicConfig(
        level=settings.LOG_LEVEL,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('app.log')
        ]
    )

logger = logging.getLogger("eventmaster")

# main.py
from src.core.logger import setup_logging, logger

setup_logging()

# Use in routes
logger.info(f"User {user.id} logged in")
logger.error(f"Database error: {e}", exc_info=True)
```

**Impact**: Low - Observability
**Effort**: Low

---

### 13. **Missing Input Sanitization**

**Problem**: No XSS protection for user inputs

**Recommendation**:
```python
# src/core/sanitize.py
import bleach

def sanitize_html(text: str) -> str:
    """Remove potentially dangerous HTML tags"""
    allowed_tags = ['b', 'i', 'u', 'em', 'strong', 'a']
    return bleach.clean(text, tags=allowed_tags, strip=True)

# Use in schemas
from pydantic import field_validator

class EventCreate(EventBase):
    @field_validator('description')
    def sanitize_description(cls, v):
        return sanitize_html(v)
```

**Impact**: Low - Security hardening
**Effort**: Low

---

### 14. **No Rate Limiting**

**Problem**: API has no rate limiting configured

**Recommendation**:
```python
# Use slowapi for rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to routes
@router.post("/login")
@limiter.limit("5/minute")  # 5 login attempts per minute
def login(...):
    pass
```

**Impact**: Low - DoS protection
**Effort**: Low

---

## ✅ What's Done Well

### Good Practices Already Implemented

1. **✅ Dependency Injection** - Excellent use of `Depends()` for db sessions and auth
2. **✅ Pydantic Validation** - Strong input validation with Field constraints
3. **✅ RBAC Implementation** - Clean role-based access control with `require_role()`
4. **✅ Password Hashing** - Using bcrypt via passlib
5. **✅ JWT Authentication** - Proper token-based auth with python-jose
6. **✅ CORS Configuration** - Middleware properly configured
7. **✅ Separation of Concerns** - models/schemas/routes/core separation
8. **✅ Environment Config** - Using pydantic-settings for configuration
9. **✅ HTTPException Usage** - Proper HTTP status codes
10. **✅ Model Relationships** - SQLAlchemy relationships properly defined
11. **✅ Cascade Deletes** - Event deletion removes registrations
12. **✅ Computed Properties** - `is_full`, `available_slots` on Event model
13. **✅ Denormalization** - Event title/date cached in Registration for performance
14. **✅ API Documentation** - Auto-generated Swagger/ReDoc docs

---

## 📊 Testing Assessment

**Current State**: ⚠️ Limited testing infrastructure

**Found**:
- ✅ `pytest` and `httpx` in requirements.txt
- ❌ No `tests/` directory visible in backend
- ❌ No test fixtures or conftest.py
- ❌ No CI/CD testing pipeline

**Recommendations**:

```
apps/api/
├── tests/
│   ├── conftest.py          # Shared fixtures
│   ├── test_auth.py         # Auth endpoint tests
│   ├── test_events.py       # Event CRUD tests
│   ├── test_registrations.py
│   ├── test_checkin.py
│   └── test_users.py
```

**Example Test**:
```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from src.database import Base
from main import app, get_db

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

# tests/test_auth.py
def test_login_success(client):
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

**Priority**: High - Essential for production
**Effort**: High - Comprehensive test suite needed

---

## 🔧 Recommended Refactoring Priority

### Phase 1: Critical Fixes (Week 1)
1. ✅ Fix UUID generation to use full UUIDs
2. ✅ Update `datetime.utcnow()` to `datetime.now(timezone.utc)`
3. ✅ Fix EventListResponse schema to match OpenAPI (`events` → `items`)
4. ✅ Add missing pagination to all list endpoints
5. ✅ Update lifespan decorator (replace `@app.on_event`)

**Estimated Effort**: 1-2 days

---

### Phase 2: SQLAlchemy 2.0 Migration (Week 2-3)
1. ✅ Migrate all `db.query()` to `select()` statements
2. ✅ Update models to use `Mapped[]` annotations
3. ✅ Replace `declarative_base()` with `DeclarativeBase`
4. ✅ Test all database operations

**Estimated Effort**: 3-5 days

---

### Phase 3: Architecture Improvements (Week 4-5)
1. ✅ Create service layer for business logic
2. ✅ Add transaction error handling
3. ✅ Add audit timestamps (BaseModel)
4. ✅ Set up structured logging
5. ✅ Write comprehensive test suite

**Estimated Effort**: 5-7 days

---

### Phase 4: Production Hardening (Week 6)
1. ✅ Add rate limiting
2. ✅ Input sanitization
3. ✅ Performance monitoring
4. ✅ Add database indexes
5. ✅ Security audit

**Estimated Effort**: 2-3 days

---

## 📋 Checklist: Production Readiness

### Database
- [ ] Migrate to SQLAlchemy 2.0 select() syntax
- [ ] Use Mapped[] annotations in models
- [ ] Add audit timestamps (created_at, updated_at)
- [ ] Optimize indexes for common queries
- [ ] Use full UUIDs or database auto-increment
- [ ] Add database migrations (Alembic)

### Code Quality
- [ ] Extract business logic to service layer
- [ ] Add transaction error handling
- [ ] Write comprehensive test suite (>80% coverage)
- [ ] Set up logging infrastructure
- [ ] Add input sanitization
- [ ] Type hints on all functions

### Security
- [ ] Change default SECRET_KEY
- [ ] Add rate limiting
- [ ] Input validation and sanitization
- [ ] SQL injection protection (via ORM)
- [ ] XSS protection
- [ ] CORS properly configured

### API
- [ ] Align all schemas with OpenAPI spec
- [ ] Consistent pagination on all list endpoints
- [ ] Proper HTTP status codes
- [ ] Error response standardization
- [ ] API versioning strategy

### Performance
- [ ] Database connection pooling
- [ ] Query optimization
- [ ] Caching strategy (if needed)
- [ ] Load testing
- [ ] Monitoring and alerting

### Documentation
- [ ] API documentation complete
- [ ] Code comments for complex logic
- [ ] Architecture diagrams updated
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

## 🎯 Final Verdict

**Overall Assessment**: 6.5/10

### Strengths
- Clean, well-organized codebase
- Good use of FastAPI features
- Solid authentication and authorization
- Clear separation of concerns

### Weaknesses
- Using outdated SQLAlchemy patterns
- Missing service layer
- Insufficient error handling
- Limited test coverage
- Some critical bugs (UUID generation)

### Recommendation

The backend has a **good foundation** but needs **significant improvements** before production deployment:

1. **Immediate** (Before any production use):
   - Fix UUID generation
   - Fix datetime deprecation
   - Align schemas with OpenAPI

2. **Short-term** (Before scaling):
   - Migrate to SQLAlchemy 2.0 patterns
   - Add service layer
   - Write comprehensive tests

3. **Long-term** (Production hardening):
   - Add monitoring and logging
   - Performance optimization
   - Security hardening

**Timeline to Production-Ready**: 4-6 weeks with dedicated effort

---

## 📚 Resources

- [SQLAlchemy 2.0 Migration Guide](https://docs.sqlalchemy.org/en/20/changelog/migration_20.html)
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)
- [Pydantic V2 Migration](https://docs.pydantic.dev/latest/migration/)
- [Python UUID Best Practices](https://docs.python.org/3/library/uuid.html)

---

**End of Review**

For questions or to discuss specific recommendations, refer to this document or create a GitHub issue.

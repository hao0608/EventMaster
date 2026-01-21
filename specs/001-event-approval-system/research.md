# Research: Event Approval System

**Feature**: Event Approval System
**Branch**: 001-event-approval-system
**Date**: 2026-01-21

## Purpose

Research technical approaches, best practices, and patterns for implementing the event approval workflow system in EventMaster. All decisions align with the project constitution and existing architecture.

---

## Research Topics

### 1. Event Status State Machine Design

**Decision**: Use Python `str` enum with three states: PENDING, PUBLISHED, REJECTED

**Rationale**:
- SQLAlchemy Column supports `Enum` directly for type safety
- String enums are JSON-serializable for API responses
- Three states cover all approval workflow needs without overcomplication
- State transitions are unidirectional (PENDING → PUBLISHED/REJECTED only)

**Alternatives Considered**:
- **Integer status codes**: Rejected - less readable, requires constant mapping
- **Boolean flags (is_approved, is_rejected)**: Rejected - allows invalid states (both True)
- **More granular states (DRAFT, PENDING, REVIEWING, etc.)**: Rejected - over-engineering for MVP

**Implementation Pattern**:
```python
# apps/api/src/models/event.py
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Enum

class EventStatus(str, PyEnum):
    PENDING = "PENDING"
    PUBLISHED = "PUBLISHED"
    REJECTED = "REJECTED"

class Event(Base):
    status = Column(String(20), default=EventStatus.PENDING, nullable=False, index=True)
```

**State Transition Rules**:
- New event by Organizer → PENDING
- New event by Admin → PUBLISHED (bypass)
- PENDING → PUBLISHED (admin approve)
- PENDING → REJECTED (admin reject)
- PUBLISHED/REJECTED → No further transitions (final states)

---

### 2. Domain Layer Architecture

**Decision**: Create `apps/api/src/domain/` directory with service classes for business logic

**Rationale**:
- Constitution Principle VII requires business logic separation from routes
- Enables testing approval logic without HTTP context
- Improves maintainability by centralizing workflow rules
- Follows existing EventMaster architecture patterns

**Alternatives Considered**:
- **Keep logic in routes**: Rejected - violates Constitution Principle VII
- **Use repository pattern**: Rejected - over-abstraction for MVP, SQLAlchemy ORM sufficient
- **Create separate approval models**: Rejected - approval is event state, not separate entity

**Domain Service Structure**:
```
apps/api/src/domain/
├── __init__.py
├── event_approval.py      # EventApprovalService
│   - approve_event(event_id, admin_id, db)
│   - reject_event(event_id, admin_id, db)
│   - get_pending_events(db)
│   - log_approval_action(event, admin, action)
└── registration.py        # RegistrationService (future)
    - create_walk_in_registration(event_id, email, name, db)
```

**Service Responsibilities**:
- **EventApprovalService**: Validate status transitions, update event status, log actions
- **Routes**: Handle HTTP (auth, request validation, response formatting)
- **Models**: Data structure and database mapping only

---

### 3. Frontend API Service Architecture

**Decision**: Replace mockApi.ts with axios-based ApiService class

**Rationale**:
- Axios provides interceptors for automatic JWT injection
- Centralized error handling (401 → redirect to login)
- Type-safe with TypeScript interfaces
- Industry standard for React applications

**Alternatives Considered**:
- **Fetch API**: Rejected - requires manual interceptor implementation, more boilerplate
- **React Query / SWR**: Rejected - overkill for MVP, adds complexity
- **GraphQL**: Rejected - not part of existing architecture

**API Service Pattern**:
```typescript
// apps/web/services/api.ts
import axios, { AxiosInstance } from 'axios';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      headers: { 'Content-Type': 'application/json' },
    });

    // Auto-inject JWT
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Handle 401 globally
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Approval methods
  async getPendingEvents() { ... }
  async approveEvent(eventId: string) { ... }
  async rejectEvent(eventId: string) { ... }
}

export const api = new ApiService();
```

---

### 4. Database Migration Strategy

**Decision**: Option C (fast) - Delete and recreate SQLite database for MVP

**Rationale**:
- Development phase, no production data to preserve
- Fastest approach for 3-day MVP timeline
- Alembic setup would take additional time
- SQLite file deletion is safe for local dev

**Alternatives Considered**:
- **Alembic migrations**: Rejected for MVP - adds setup time, overkill for single schema change
- **Manual ALTER TABLE SQL**: Rejected - fragile, no version control
- **Keep both DBs**: Rejected - data inconsistency issues

**Migration Steps** (Day 1):
```bash
cd apps/api
rm -f eventmaster.db
python seed_data.py  # Recreate with status field
```

**Production Note**: When moving to production PostgreSQL, Alembic migrations will be required.

---

### 5. QR Code Generation Strategy

**Decision**: Backend generates UUID string token, frontend renders as QR image using qrcode.react

**Rationale**:
- Separation of concerns: backend handles unique token generation, frontend handles presentation
- UUID v4 provides sufficient uniqueness (collision probability negligible)
- Client-side QR rendering reduces server load
- qrcode.react is lightweight and well-maintained

**Alternatives Considered**:
- **Backend generates QR images**: Rejected - increases server CPU/memory, couples presentation to backend
- **Third-party QR service**: Rejected - unnecessary external dependency, privacy concerns
- **Sequential IDs**: Rejected - predictable, security risk (ticket guessing)

**Implementation**:
```python
# Backend: Generate token
import uuid
registration.qr_code = str(uuid.uuid4())
```

```typescript
// Frontend: Render QR
import QRCode from 'qrcode.react';
<QRCode value={ticket.qr_code} size={200} level="H" />
```

---

### 6. Logging & Audit Trail

**Decision**: Use Python's built-in `logging` module with structured logging for approval actions

**Rationale**:
- FR-013 requires logging approval/rejection actions with admin ID and timestamp
- Python logging is stdlib, no additional dependencies
- Structured logs enable audit trail queries
- Can be extended to external logging service (e.g., CloudWatch) in production

**Alternatives Considered**:
- **Separate audit_logs table**: Rejected for MVP - over-engineering, can add later if needed
- **No logging**: Rejected - violates functional requirement FR-013
- **Third-party logging (Sentry, Datadog)**: Deferred to production deployment

**Logging Pattern**:
```python
import logging
logger = logging.getLogger(__name__)

# In EventApprovalService
def approve_event(event_id: str, admin_id: str, db: Session):
    event.status = EventStatus.PUBLISHED
    db.commit()
    logger.info(
        f"Event {event_id} approved by admin {admin_id}",
        extra={
            "event_id": event_id,
            "admin_id": admin_id,
            "action": "APPROVE",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

---

### 7. CORS Configuration for Local Development

**Decision**: Configure FastAPI CORS middleware to allow `http://localhost:5173` (Vite default port)

**Rationale**:
- Frontend (Vite) runs on port 5173, backend (FastAPI) on port 8000
- CORS policy required for cross-origin API calls
- Allow credentials for JWT cookies/headers

**Implementation**:
```python
# apps/api/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production**: Use environment variable for allowed origins.

---

### 8. Frontend Error Handling Pattern

**Decision**: Use React state pattern: `[data, loading, error]` for all API calls

**Rationale**:
- Clear separation of loading/success/error states
- User feedback for all API operations (Constitution Principle III)
- Industry standard React pattern

**Pattern**:
```typescript
const [events, setEvents] = useState<Event[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleApprove = async (eventId: string) => {
  try {
    setLoading(true);
    setError(null);
    await api.approveEvent(eventId);
    // Update UI optimistically
    setEvents(prev => prev.filter(e => e.id !== eventId));
  } catch (err) {
    setError(err.message || 'Approval failed');
  } finally {
    setLoading(false);
  }
};
```

---

### 9. TypeScript Interface Definitions

**Decision**: Define all API interfaces in `apps/web/types.ts` before implementation

**Rationale**:
- Constitution Principle I: Interface-driven development
- Type safety prevents runtime errors
- Self-documenting code

**New Interfaces**:
```typescript
// Event status enum
export enum EventStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

// Update Event interface
export interface Event {
  // ... existing fields
  status: EventStatus;
}

// API response interfaces
export interface PendingEventsResponse {
  items: Event[];
  total: number;
}

export interface ApprovalActionResponse {
  success: boolean;
  message: string;
  event: Event;
}
```

---

### 10. Testing Strategy

**Decision**: Integration tests for API endpoints, unit tests for domain services, component tests for React pages

**Rationale**:
- Constitution Principle IV: Test-driven quality
- Focus on critical paths (approval workflow, RBAC)
- Target ≥80% coverage for domain logic

**Test Structure**:
```
Backend Tests:
- apps/api/tests/unit/test_event_approval_domain.py
  - Test state transitions
  - Test validation rules
  - Test logging

- apps/api/tests/integration/test_approval_endpoints.py
  - Test GET /events/pending (Admin only)
  - Test PATCH /events/{id}/approve
  - Test PATCH /events/{id}/reject
  - Test POST /events (status assignment logic)

Frontend Tests:
- apps/web/__tests__/components/AdminEventApprovals.test.tsx
  - Test pending events display
  - Test approve/reject actions
  - Test error handling
```

---

## OpenAPI Schema Changes

Per Constitution Principle VI (OpenAPI-First Development), all API changes must be documented in `docs/openapi.yaml` before implementation. See `contracts/openapi-changes.yaml` for detailed schema additions.

**New Endpoints**:
1. `GET /events/pending` - List pending events (Admin only)
2. `PATCH /events/{id}/approve` - Approve event (Admin only)
3. `PATCH /events/{id}/reject` - Reject event (Admin only)

**Modified Endpoints**:
1. `POST /events` - Add status assignment logic based on user role
2. `GET /events` - Add status filtering (Members see PUBLISHED only)

**New Schemas**:
1. `EventStatus` enum (PENDING, PUBLISHED, REJECTED)
2. `ApprovalActionResponse` schema

---

## Summary

All technical decisions documented and aligned with:
- Project constitution (all 9 principles addressed)
- Existing EventMaster architecture (docs/ARCHITECTURE.md)
- 3-day MVP timeline (docs/3DAY_MVP_PLAN.md)
- No [NEEDS CLARIFICATION] items remaining

Ready to proceed to Phase 1: Design & Contracts.

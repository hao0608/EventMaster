# Data Model: Event Approval System

**Feature**: Event Approval System
**Branch**: 001-event-approval-system
**Date**: 2026-01-21

## Overview

This document defines the data model changes required for the event approval workflow system. The primary change is adding a `status` field to the Event entity to support PENDING/PUBLISHED/REJECTED states.

---

## Entity: Event (Modified)

**Purpose**: Represents a scheduled activity with approval status tracking

### Attributes

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | uuid4() | Unique event identifier |
| organizer_id | String (UUID) | FOREIGN KEY → users(id), NOT NULL, INDEX | - | Reference to organizing user |
| title | String(200) | NOT NULL | - | Event name |
| description | String(2000) | NOT NULL | - | Event details |
| start_at | DateTime | NOT NULL, INDEX | - | Event start time (ISO 8601) |
| end_at | DateTime | NOT NULL | - | Event end time (ISO 8601) |
| location | String(500) | NOT NULL | - | Event venue |
| capacity | Integer | NOT NULL, CHECK (capacity > 0) | - | Maximum attendees |
| registered_count | Integer | NOT NULL, CHECK (registered_count >= 0) | 0 | Current registration count |
| **status** | **String(20)** | **NOT NULL, INDEX** | **PENDING** | **Event approval status (NEW)** |
| created_at | DateTime | NOT NULL | NOW() | Creation timestamp |
| updated_at | DateTime | NOT NULL | NOW() | Last update timestamp |

### Status Field (NEW)

**Enum Values**:
- `PENDING`: Event created, awaiting admin approval
- `PUBLISHED`: Event approved, visible to public
- `REJECTED`: Event rejected, not visible to public

**State Transition Rules**:
```
[Organizer creates event] → PENDING
[Admin creates event] → PUBLISHED (bypass approval)

PENDING → PUBLISHED (admin approves)
PENDING → REJECTED (admin rejects)

PUBLISHED → [final state, no further transitions]
REJECTED → [final state, no further transitions]
```

**Validation Rules**:
1. Only users with role ADMIN can transition status from PENDING
2. Status transitions must follow state machine (no PUBLISHED → PENDING)
3. Events with status PUBLISHED or REJECTED cannot be deleted without admin approval

### Relationships

- **Belongs to** User (organizer): `Event.organizer_id → User.id`
- **Has many** Registrations: `Registration.event_id → Event.id` (cascade delete)

### Indexes

- `idx_events_organizer_id` on `organizer_id` (existing)
- `idx_events_start_at` on `start_at` (existing)
- **`idx_events_status` on `status` (NEW)** - Optimize queries for pending events

---

## Entity: Registration (No Changes)

**Purpose**: Represents a user's ticket for an event

### Attributes

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | uuid4() | Unique registration ID |
| event_id | String (UUID) | FOREIGN KEY → events(id), NOT NULL, INDEX | - | Associated event |
| user_id | String (UUID) | FOREIGN KEY → users(id), NOT NULL, INDEX | - | Registered user |
| status | String(20) | NOT NULL | REGISTERED | Registration status |
| qr_code | String(36) | UNIQUE, NOT NULL, INDEX | uuid4() | QR code token for verification |
| created_at | DateTime | NOT NULL | NOW() | Registration timestamp |
| event_title | String | NOT NULL | - | Denormalized event title |
| event_start_at | DateTime | NOT NULL | - | Denormalized event start time |

**Status Values** (existing, no changes):
- `REGISTERED`: User registered, not yet checked in
- `CHECKED_IN`: User verified at event entrance
- `CANCELLED`: Registration cancelled by user

**Composite Index** (existing):
- `idx_registration_event_user` on `(event_id, user_id)` UNIQUE - Prevent duplicate registrations

**Note**: No schema changes needed for registrations. The walk-in registration feature uses the existing `CHECKED_IN` status.

---

## Entity: User (No Changes)

**Purpose**: System users with role-based permissions

### Attributes

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | uuid4() | Unique user ID |
| email | String(255) | UNIQUE, NOT NULL, INDEX | - | User email (login identifier) |
| password_hash | String(255) | NOT NULL | - | Bcrypt hashed password |
| display_name | String(100) | NOT NULL | - | User's display name |
| role | String(20) | NOT NULL | MEMBER | User role enum |

**Role Values** (existing, no changes):
- `MEMBER`: Can view published events and register
- `ORGANIZER`: Can create events (enter PENDING), verify tickets
- `ADMIN`: Can approve/reject events, full system access

---

## Database Migration

### SQLite (Development)

**Migration Strategy**: Delete and recreate database (fast approach for MVP)

```bash
cd apps/api
rm -f eventmaster.db
python seed_data.py  # Recreates with status field
```

### PostgreSQL (Production)

**Alembic Migration** (future, when moving to production):

```sql
-- Migration: Add status field to events table
ALTER TABLE events
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

-- Add index for status queries
CREATE INDEX idx_events_status ON events(status);

-- Update existing events to PUBLISHED (assume all existing are approved)
UPDATE events SET status = 'PUBLISHED';
```

---

## Data Constraints & Validation

### Event Validation Rules

1. **Status Transitions**:
   - Only ADMIN role can change status from PENDING
   - Transitions must follow state machine (no backward transitions)
   - Validation enforced in domain service layer

2. **Capacity Management**:
   - `registered_count` must always be ≤ `capacity`
   - Enforced on registration creation (including walk-in)

3. **Date Validation**:
   - `end_at` must be after `start_at`
   - Enforced in Pydantic schema validation

### Registration Validation Rules

1. **Uniqueness**:
   - Composite index enforces one registration per (event_id, user_id)
   - Database-level constraint prevents race conditions

2. **QR Code Uniqueness**:
   - UUID v4 collision probability negligible
   - Unique constraint on `qr_code` field

3. **Status Transitions**:
   - `REGISTERED` → `CHECKED_IN` (verification)
   - `REGISTERED` → `CANCELLED` (user cancels)
   - `CHECKED_IN` / `CANCELLED` → [final states]

---

## Seed Data Updates

### Required Test Data

**Users** (existing, no changes):
- `admin@company.com` (role: ADMIN)
- `org@company.com` (role: ORGANIZER)
- `member@company.com` (role: MEMBER)

**Events** (NEW: Create with different statuses):
- 2 events with status `PENDING` (for testing approval workflow)
- 5 events with status `PUBLISHED` (for testing registration)
- 1 event with status `REJECTED` (for testing access control)

**Registrations** (existing):
- Member registered for some PUBLISHED events
- Mix of REGISTERED and CHECKED_IN statuses

```python
# apps/api/seed_data.py additions
from models.event import EventStatus

# Pending events (by organizer)
pending_event_1 = Event(
    id=str(uuid.uuid4()),
    organizer_id=organizer.id,
    title="Pending Workshop",
    description="Awaiting approval",
    start_at=datetime.now() + timedelta(days=15),
    end_at=datetime.now() + timedelta(days=15, hours=2),
    location="Room B",
    capacity=30,
    registered_count=0,
    status=EventStatus.PENDING  # NEW
)

# Published events (approved)
published_event = Event(
    # ... other fields
    status=EventStatus.PUBLISHED  # NEW
)

# Rejected event (for access control testing)
rejected_event = Event(
    # ... other fields
    status=EventStatus.REJECTED  # NEW
)
```

---

## Query Patterns

### Common Queries

**1. Get pending events (Admin approval page)**:
```python
# Domain service
def get_pending_events(db: Session) -> List[Event]:
    return db.query(Event)\
        .filter(Event.status == EventStatus.PENDING)\
        .order_by(Event.created_at.desc())\
        .all()
```

**2. Get published events (Public event list)**:
```python
# For Members/Guests
def get_published_events(db: Session, limit: int = 20, offset: int = 0):
    return db.query(Event)\
        .filter(Event.status == EventStatus.PUBLISHED)\
        .order_by(Event.start_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()
```

**3. Get events by organizer (Managed events)**:
```python
# For Organizers to see their own events (all statuses)
def get_organizer_events(organizer_id: str, db: Session):
    return db.query(Event)\
        .filter(Event.organizer_id == organizer_id)\
        .order_by(Event.created_at.desc())\
        .all()
```

**4. Approve event (Admin action)**:
```python
# Domain service with validation
def approve_event(event_id: str, admin_id: str, db: Session) -> Event:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != EventStatus.PENDING:
        raise HTTPException(status_code=400, detail="Event is not pending")

    event.status = EventStatus.PUBLISHED
    db.commit()
    db.refresh(event)

    # Log action
    logger.info(f"Event {event_id} approved by admin {admin_id}")
    return event
```

---

## Data Integrity

### Referential Integrity

- **Cascade Delete**: When event is deleted, all associated registrations are deleted
- **Foreign Key Constraints**: Enforced at database level (SQLAlchemy relationships)

### Concurrency Handling

- **Optimistic Locking**: SQLAlchemy session handles transaction isolation
- **Duplicate Prevention**: Composite unique index on (event_id, user_id) for registrations
- **Race Condition**: Status transitions protected by transaction-level locks

### Data Denormalization

- **Registration.event_title** and **Registration.event_start_at**: Denormalized for "My Tickets" query performance
- **Trade-off**: Slight data duplication vs. avoiding JOIN on every ticket display
- **Consistency**: Updated when event is modified (if implemented in future)

---

## Summary

**Schema Changes**:
1. Add `status` field to `events` table (String(20), default PENDING, indexed)
2. No changes to `users` or `registrations` tables

**Data Migration**:
- Development: Delete and recreate SQLite database
- Production: Alembic migration with default PUBLISHED for existing events

**Seed Data**:
- Create events with PENDING, PUBLISHED, and REJECTED statuses for testing

**Ready for**: API contract definition (Phase 1 continued)

# Quickstart Guide: Event Approval System

**Feature**: Event Approval System
**Branch**: 001-event-approval-system
**Date**: 2026-01-21

## Purpose

This guide helps developers quickly set up, implement, and test the event approval workflow feature. Follow the 3-day implementation plan outlined in docs/3DAY_MVP_PLAN.md.

---

## Prerequisites

- ✅ On feature branch: `001-event-approval-system`
- ✅ Python 3.11+ installed with venv
- ✅ Node.js 18+ installed with npm
- ✅ Read spec.md, plan.md, research.md, data-model.md
- ✅ Familiar with EventMaster codebase structure

---

## Day 1: Backend Core (4-8 hours)

### Morning: Database Schema & Domain Layer

**Step 1: Update Event Model**

```bash
cd apps/api
```

Edit `src/models/event.py`:
```python
# Add at top
from enum import Enum as PyEnum
from sqlalchemy import Enum

# Add enum class
class EventStatus(str, PyEnum):
    PENDING = "PENDING"
    PUBLISHED = "PUBLISHED"
    REJECTED = "REJECTED"

# Add to Event class
class Event(Base):
    # ... existing fields
    status = Column(String(20), default=EventStatus.PENDING, nullable=False, index=True)
```

**Step 2: Reset Database**

```bash
rm -f eventmaster.db
python seed_data.py
```

Verify: `ls -lh eventmaster.db` (should exist)

**Step 3: Update Pydantic Schemas**

Edit `src/schemas/event.py`:
```python
from ..models.event import EventStatus

class EventResponse(BaseModel):
    # ... existing fields
    status: EventStatus  # Add this

    model_config = ConfigDict(from_attributes=True)
```

**Step 4: Create Domain Service**

Create `src/domain/__init__.py` (empty file)

Create `src/domain/event_approval.py`:
```python
from typing import List
from sqlalchemy.orm import Session
from ..models.event import Event, EventStatus
from ..models.user import UserRole
from fastapi import HTTPException, status as http_status
import logging

logger = logging.getLogger(__name__)

class EventApprovalService:
    @staticmethod
    def get_pending_events(db: Session, limit: int = 20, offset: int = 0) -> List[Event]:
        """Get all pending events for admin review."""
        return db.query(Event)\
            .filter(Event.status == EventStatus.PENDING)\
            .order_by(Event.created_at.desc())\
            .limit(limit)\
            .offset(offset)\
            .all()

    @staticmethod
    def approve_event(event_id: str, admin_id: str, db: Session) -> Event:
        """Approve a pending event (change status to PUBLISHED)."""
        event = db.query(Event).filter(Event.id == event_id).first()

        if not event:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )

        if event.status != EventStatus.PENDING:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Event is not pending"
            )

        event.status = EventStatus.PUBLISHED
        db.commit()
        db.refresh(event)

        logger.info(
            f"Event {event_id} approved by admin {admin_id}",
            extra={"event_id": event_id, "admin_id": admin_id, "action": "APPROVE"}
        )

        return event

    @staticmethod
    def reject_event(event_id: str, admin_id: str, db: Session) -> Event:
        """Reject a pending event (change status to REJECTED)."""
        event = db.query(Event).filter(Event.id == event_id).first()

        if not event:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )

        if event.status != EventStatus.PENDING:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Event is not pending"
            )

        event.status = EventStatus.REJECTED
        db.commit()
        db.refresh(event)

        logger.info(
            f"Event {event_id} rejected by admin {admin_id}",
            extra={"event_id": event_id, "admin_id": admin_id, "action": "REJECT"}
        )

        return event
```

### Afternoon: API Routes

**Step 5: Update Events Routes**

Edit `src/routes/events.py`:

```python
# Add imports
from ..domain.event_approval import EventApprovalService
from ..models.event import EventStatus

# MODIFY: POST /events - Add status logic
@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    # Determine status based on user role
    event_status = (
        EventStatus.PUBLISHED if current_user.role == UserRole.ADMIN
        else EventStatus.PENDING
    )

    event = Event(
        id=str(uuid.uuid4()),
        organizer_id=current_user.id,
        status=event_status,  # NEW
        **event_data.model_dump(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

# MODIFY: GET /events - Filter by status
@router.get("", response_model=EventListResponse)
def get_events(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    query = db.query(Event)

    # Apply status filter based on user role
    if not current_user or current_user.role == UserRole.MEMBER:
        query = query.filter(Event.status == EventStatus.PUBLISHED)
    elif current_user.role == UserRole.ORGANIZER:
        # Organizers see PUBLISHED + their own events
        query = query.filter(
            (Event.status == EventStatus.PUBLISHED) |
            (Event.organizer_id == current_user.id)
        )
    # Admins see all events (no filter)

    events = query.order_by(Event.start_at.desc()).limit(limit).offset(offset).all()
    total = query.count()

    return EventListResponse(items=events, total=total, limit=limit, offset=offset)

# ADD: GET /events/pending
@router.get("/pending", response_model=EventListResponse)
def get_pending_events(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get all pending events for admin review."""
    events = EventApprovalService.get_pending_events(db, limit, offset)
    total = db.query(Event).filter(Event.status == EventStatus.PENDING).count()

    return EventListResponse(items=events, total=total, limit=limit, offset=offset)

# ADD: PATCH /events/{event_id}/approve
@router.patch("/{event_id}/approve", response_model=EventResponse)
def approve_event(
    event_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Approve a pending event."""
    return EventApprovalService.approve_event(event_id, current_user.id, db)

# ADD: PATCH /events/{event_id}/reject
@router.patch("/{event_id}/reject", response_model=EventResponse)
def reject_event(
    event_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Reject a pending event."""
    return EventApprovalService.reject_event(event_id, current_user.id, db)
```

**Step 6: Test Backend**

```bash
# Start backend
uvicorn main:app --reload

# Test in another terminal
# 1. Login as admin
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com", "password":"password123"}'

# Copy the accessToken from response

# 2. Get pending events
curl http://localhost:8000/events/pending \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Approve an event (use event ID from pending list)
curl -X PATCH http://localhost:8000/events/EVENT_ID/approve \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Verify event is now published
curl http://localhost:8000/events
```

---

## Day 2: Frontend Integration (4-8 hours)

### Morning: API Service Layer

**Step 7: Install Dependencies**

```bash
cd apps/web
npm install axios qrcode.react
npm install --save-dev @types/qrcode.react
```

**Step 8: Create API Service**

Create `src/services/api.ts`:
```typescript
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Auto-inject JWT token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Events
  async getEvents(limit = 20, offset = 0) {
    const response = await this.client.get('/events', { params: { limit, offset } });
    return response.data;
  }

  async getPendingEvents() {
    const response = await this.client.get('/events/pending');
    return response.data;
  }

  async approveEvent(eventId: string) {
    const response = await this.client.patch(`/events/${eventId}/approve`);
    return response.data;
  }

  async rejectEvent(eventId: string) {
    const response = await this.client.patch(`/events/${eventId}/reject`);
    return response.data;
  }

  // Registrations
  async registerForEvent(eventId: string) {
    const response = await this.client.post(`/events/${eventId}/registrations`);
    return response.data;
  }

  async getMyRegistrations() {
    const response = await this.client.get('/me/registrations');
    return response.data;
  }
}

export const api = new ApiService();
```

**Step 9: Update Types**

Edit `src/types.ts`:
```typescript
// Add EventStatus enum
export enum EventStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

// Update Event interface
export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  capacity: number;
  registeredCount: number;
  status: EventStatus;  // NEW
}
```

### Afternoon: Admin Approval Page

**Step 10: Create Admin Approvals Page**

Create `src/pages/AdminEventApprovals.tsx`:
```typescript
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Event, EventStatus } from '../types';

export const AdminEventApprovals: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingEvents();
  }, []);

  const loadPendingEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPendingEvents();
      setEvents(data.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load pending events');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    if (!confirm('Are you sure you want to approve this event?')) return;

    try {
      await api.approveEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      alert('Event approved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve event');
    }
  };

  const handleReject = async (eventId: string) => {
    if (!confirm('Are you sure you want to reject this event?')) return;

    try {
      await api.rejectEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      alert('Event rejected successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject event');
    }
  };

  if (loading) return <div>Loading pending events...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h1>Event Approvals</h1>
      {events.length === 0 ? (
        <p>No pending events</p>
      ) : (
        <ul>
          {events.map(event => (
            <li key={event.id}>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
              <p>Organizer: {event.organizerId}</p>
              <p>Start: {new Date(event.startAt).toLocaleString()}</p>
              <p>Capacity: {event.capacity}</p>
              <button onClick={() => handleApprove(event.id)}>Approve</button>
              <button onClick={() => handleReject(event.id)}>Reject</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

**Step 11: Add Route**

Edit `src/App.tsx`:
```typescript
import { AdminEventApprovals } from './pages/AdminEventApprovals';

// Add route
<Route
  path="/admin/approvals"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminEventApprovals />
    </ProtectedRoute>
  }
/>
```

**Step 12: Update Navbar**

Edit `src/components/Navbar.tsx`:
```typescript
// Add link for admins
{user?.role === 'admin' && (
  <Link to="/admin/approvals">Event Approvals</Link>
)}
```

**Step 13: Test Frontend**

```bash
npm run dev

# Open http://localhost:5173
# 1. Login as admin@company.com / password123
# 2. Click "Event Approvals"
# 3. Approve/reject pending events
# 4. Verify events appear in public list after approval
```

---

## Day 3: Testing & Polish (4-8 hours)

### Backend Tests

**Step 14: Write Domain Service Tests**

Create `tests/backend/unit/test_event_approval_domain.py`:
```python
import pytest
from apps.api.src.domain.event_approval import EventApprovalService
from apps.api.src.models.event import Event, EventStatus

def test_approve_event_success(db_session, admin_user, pending_event):
    result = EventApprovalService.approve_event(pending_event.id, admin_user.id, db_session)
    assert result.status == EventStatus.PUBLISHED

def test_approve_event_not_pending_fails(db_session, admin_user, published_event):
    with pytest.raises(HTTPException) as exc:
        EventApprovalService.approve_event(published_event.id, admin_user.id, db_session)
    assert exc.value.status_code == 400
```

### Frontend Tests

**Step 15: Write Component Tests**

Create `tests/frontend/components/AdminEventApprovals.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminEventApprovals } from '../../../apps/web/src/pages/AdminEventApprovals';

test('displays pending events', async () => {
  render(<AdminEventApprovals />);
  await waitFor(() => {
    expect(screen.getByText(/pending events/i)).toBeInTheDocument();
  });
});
```

---

## Environment Configuration

Create `apps/web/.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Common Issues & Solutions

**Issue**: CORS error in browser
**Solution**: Verify `apps/api/main.py` CORS config includes `http://localhost:5173`

**Issue**: 401 Unauthorized
**Solution**: Check JWT token in localStorage, verify token not expired

**Issue**: Events not filtering by status
**Solution**: Verify Event model has status field, database recreated with migration

---

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] Admin can login and access /events/pending
- [ ] Admin can approve pending event → status changes to PUBLISHED
- [ ] Admin can reject pending event → status changes to REJECTED
- [ ] Organizer creates event → status is PENDING
- [ ] Admin creates event → status is PUBLISHED
- [ ] Member only sees PUBLISHED events
- [ ] Member cannot access /admin/approvals (403)
- [ ] Frontend displays QR codes on My Tickets page
- [ ] Walk-in registration creates user and marks as CHECKED_IN

---

## Next Steps

After implementation complete:
1. Run full test suite: `pytest apps/api/tests && npm test --prefix apps/web`
2. Create pull request from `001-event-approval-system` to `main`
3. Request code review
4. Address review feedback
5. Merge to main

---

## Resources

- Feature Spec: [spec.md](./spec.md)
- Implementation Plan: [plan.md](./plan.md)
- Data Model: [data-model.md](./data-model.md)
- API Contracts: [contracts/openapi-changes.yaml](./contracts/openapi-changes.yaml)
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
- 3-Day Plan: [docs/3DAY_MVP_PLAN.md](../../docs/3DAY_MVP_PLAN.md)

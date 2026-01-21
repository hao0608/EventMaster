# Tasks: Event Approval System

**Feature**: Event Approval System
**Branch**: `001-event-approval-system`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Task Format

```
- [ ] [TaskID] [Priority] [Story#] Description with exact file path
```

**Priority Levels**: P1 (Critical) → P2 (High) → P3 (Nice-to-have)
**Story Mapping**: Story1, Story2, Story3, Story4, Story5 (corresponds to user stories in spec.md)

---

## Phase 1: Setup & Prerequisites

**Goal**: Initialize project dependencies and validate environment

- [X] [T001] [P1] Verify Python 3.11+ installed and create virtual environment at `apps/api/.venv/` (Poetry)
- [X] [T002] [P1] Install backend dependencies from `apps/api/requirements.txt` (FastAPI 0.109+, SQLAlchemy 2.0+)
- [X] [T003] [P1] Install frontend dependencies: `cd apps/web && npm install axios qrcode.react`
- [X] [T004] [P1] Update `docs/openapi.yaml` with changes from `specs/001-event-approval-system/contracts/openapi-changes.yaml`
- [X] [T005] [P1] Validate OpenAPI spec: `npx @stoplight/spectral-cli lint docs/openapi.yaml`
- [X] [T006] [P1] Create feature branch if not exists: `git checkout -b 001-event-approval-system`

**Dependencies**: None (foundational setup)

---

## Phase 2: Foundational - Domain Layer & Data Model

**Goal**: Establish domain layer architecture and update Event model with status field

### Backend Core

- [X] [T007] [P1] Create domain layer directory: `apps/api/src/domain/` with `__init__.py`
- [X] [T008] [P1] Add EventStatus enum to `apps/api/src/models/event.py` (PENDING, PUBLISHED, REJECTED)
- [X] [T009] [P1] Add status field to Event model in `apps/api/src/models/event.py` (String(20), indexed, default=PENDING)
- [X] [T010] [P1] Update Event Pydantic schemas in `apps/api/src/schemas/event.py` to include status field
- [X] [T011] [P1] Create `apps/api/src/domain/event_approval.py` with EventApprovalService class skeleton
- [X] [T012] [P1] Backup existing database: `cp apps/api/eventmaster.db apps/api/eventmaster.db.backup`
- [X] [T013] [P1] Delete SQLite database: `rm -f apps/api/eventmaster.db`
- [X] [T014] [P1] Update `apps/api/seed_data.py` to create events with PENDING, PUBLISHED, REJECTED statuses
- [X] [T015] [P1] Run seed script to recreate database: `cd apps/api && python seed_data.py`
- [X] [T016] [P1] Verify database has status field: `sqlite3 eventmaster.db ".schema events"`

### Frontend Core

- [X] [T017] [P1] Add EventStatus enum to `apps/web/src/types.ts` (PENDING, PUBLISHED, REJECTED)
- [X] [T018] [P1] Update Event interface in `apps/web/src/types.ts` to include status field
- [X] [T019] [P1] Create `apps/web/src/services/api.ts` with axios client and JWT interceptors
- [X] [T020] [P1] Add CORS middleware configuration in `apps/api/main.py` for http://localhost:5173

**Dependencies**: T001-T006 (setup) must complete first

---

## Phase 3: User Story 1 - Organizer Proposes Event (P1)

**Story**: As an Organizer, I create event proposals that enter PENDING status awaiting admin review

### Backend Implementation

- [X] [T021] [P1] [Story1] Update POST /events in `apps/api/src/routes/events.py` to set status=PENDING for organizers
- [X] [T022] [P1] [Story1] Update POST /events to set status=PUBLISHED for admins (bypass approval)
- [X] [T023] [P1] [Story1] Add logging in `apps/api/src/domain/event_approval.py` for event creation with status

### Frontend Implementation

- [X] [T024] [P1] [Story1] Update `apps/web/src/pages/AdminCreateEvent.tsx` to display status after creation
- [X] [T025] [P1] [Story1] Add createEvent method to `apps/web/src/services/api.ts`
- [X] [T026] [P1] [Story1] Update `apps/web/src/pages/Events.tsx` to filter only PUBLISHED events for members

**Dependencies**: Phase 2 (T007-T020) must complete first

---

## Phase 4: User Story 2 - Admin Approves/Rejects Events (P1)

**Story**: As an Admin, I review pending events and approve/reject them to control what gets published

### Backend Implementation

- [X] [T027] [P1] [Story2] Implement approve_event() in `apps/api/src/domain/event_approval.py` with validation
- [X] [T028] [P1] [Story2] Implement reject_event() in `apps/api/src/domain/event_approval.py` with validation
- [X] [T029] [P1] [Story2] Implement get_pending_events() in `apps/api/src/domain/event_approval.py`
- [X] [T030] [P1] [Story2] Add logging for approval actions (admin_id, event_id, action, timestamp)
- [X] [T031] [P1] [Story2] Create GET /events/pending endpoint in `apps/api/src/routes/events.py` (admin only)
- [X] [T032] [P1] [Story2] Create PATCH /events/{id}/approve endpoint in `apps/api/src/routes/events.py` (admin only)
- [X] [T033] [P1] [Story2] Create PATCH /events/{id}/reject endpoint in `apps/api/src/routes/events.py` (admin only)
- [X] [T034] [P1] [Story2] Add ApprovalActionResponse schema to `apps/api/src/schemas/approval.py`

### Frontend Implementation

- [X] [T035] [P1] [Story2] Create `apps/web/src/pages/AdminEventApprovals.tsx` with pending events list
- [X] [T036] [P1] [Story2] Add getPendingEvents() method to `apps/web/src/services/api.ts`
- [X] [T037] [P1] [Story2] Add approveEvent(eventId) method to `apps/web/src/services/api.ts`
- [X] [T038] [P1] [Story2] Add rejectEvent(eventId) method to `apps/web/src/services/api.ts`
- [X] [T039] [P1] [Story2] Implement approve button handler in `apps/web/src/pages/AdminEventApprovals.tsx`
- [X] [T040] [P1] [Story2] Implement reject button handler in `apps/web/src/pages/AdminEventApprovals.tsx`
- [X] [T041] [P1] [Story2] Add error handling (loading/error/success states) to approval page
- [X] [T042] [P1] [Story2] Update `apps/web/src/components/Navbar.tsx` to add "Approvals" link for admins
- [X] [T043] [P1] [Story2] Add /admin/approvals route to `apps/web/src/App.tsx` with ProtectedRoute (admin only)

**Dependencies**: Phase 3 (T021-T026) must complete first

---

## Phase 5: User Story 3 - Members Register for Events (P2)

**Story**: As a Member, I register for approved events and receive QR code tickets

### Backend Implementation

- [X] [T044] [P2] [Story3] Update GET /events in `apps/api/src/routes/events.py` to filter by status based on user role
- [X] [T045] [P2] [Story3] Ensure POST /events/{id}/registrations only allows PUBLISHED events for members
- [X] [T046] [P2] [Story3] Verify QR code generation (UUID v4) in `apps/api/src/models/registration.py`

### Frontend Implementation

- [X] [T047] [P2] [Story3] Update `apps/web/src/pages/Events.tsx` to call api.getEvents() instead of mockApi
- [X] [T048] [P2] [Story3] Update `apps/web/src/pages/EventDetail.tsx` to call api.registerForEvent()
- [X] [T049] [P2] [Story3] Update `apps/web/src/pages/MyTickets.tsx` to display QR codes using qrcode.react
- [X] [T050] [P2] [Story3] Add getEvents() method to `apps/web/src/services/api.ts`
- [X] [T051] [P2] [Story3] Add registerForEvent(eventId) method to `apps/web/src/services/api.ts`
- [X] [T052] [P2] [Story3] Add getMyRegistrations() method to `apps/web/src/services/api.ts`
- [X] [T053] [P2] [Story3] Implement QRCode component in `apps/web/src/pages/MyTickets.tsx` with error handling

**Dependencies**: Phase 4 (T027-T043) must complete first

---

## Phase 6: User Story 4 - Organizers Verify Tickets (P2)

**Story**: As an Organizer, I verify attendees at event entrance by scanning QR codes

### Backend Implementation

- [X] [T054] [P2] [Story4] Update POST /verify in `apps/api/src/routes/checkin.py` to use event_approval domain logic
- [X] [T055] [P2] [Story4] Add validation: only PUBLISHED events allow check-in
- [X] [T056] [P2] [Story4] Ensure POST /verify updates registration status to CHECKED_IN

### Frontend Implementation

- [X] [T057] [P2] [Story4] Update `apps/web/src/pages/OrganizerVerify.tsx` to call api.verifyTicket()
- [X] [T058] [P2] [Story4] Add verifyTicket(qrCode) method to `apps/web/src/services/api.ts`
- [X] [T059] [P2] [Story4] Implement QR code input and verification UI in `apps/web/src/pages/OrganizerVerify.tsx`
- [X] [T060] [P2] [Story4] Add success/error feedback for verification in UI

**Dependencies**: Phase 5 (T044-T053) must complete first

---

## Phase 7: User Story 5 - Walk-in Registration (P3)

**Story**: As an Organizer, I register walk-in attendees at the event entrance without pre-registration

### Backend Implementation

- [X] [T061] [P3] [Story5] Create `apps/api/src/domain/registration.py` with WalkInService class
- [X] [T062] [P3] [Story5] Implement create_walk_in_registration() in registration domain service
- [X] [T063] [P3] [Story5] Add validation: only PUBLISHED events allow walk-in registration
- [X] [T064] [P3] [Story5] Update POST /walk-in in `apps/api/src/routes/checkin.py` to use domain service
- [X] [T065] [P3] [Story5] Ensure walk-in registrations have status=CHECKED_IN by default

### Frontend Implementation

- [X] [T066] [P3] [Story5] Add "Walk-in Registration" tab to `apps/web/src/pages/OrganizerVerify.tsx`
- [X] [T067] [P3] [Story5] Add walkInRegistration(eventId, email, name) method to `apps/web/src/services/api.ts`
- [X] [T068] [P3] [Story5] Implement walk-in form (email, name inputs) in verification page
- [X] [T069] [P3] [Story5] Add capacity validation feedback for walk-in registration
- [X] [T070] [P3] [Story5] Display success message with auto-checked-in status

**Dependencies**: Phase 6 (T054-T060) must complete first

---

## Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Ensure production readiness, error handling, and user experience polish

### Error Handling & Validation

- [X] [T071] [P2] Add HTTPException handlers for 400 (InvalidStatus) in all approval endpoints
- [X] [T072] [P2] Add HTTPException handlers for 403 (Forbidden) in admin-only endpoints
- [X] [T073] [P2] Add error boundaries in `apps/web/src/App.tsx` for global error handling
- [X] [T074] [P2] Implement loading spinners for all async operations in frontend
- [X] [T075] [P2] Add user feedback toasts/notifications for success/error states

### Security & Access Control

- [X] [T076] [P1] Verify RBAC enforcement: members cannot access /events/pending
- [X] [T077] [P1] Verify RBAC enforcement: members cannot approve/reject events
- [X] [T078] [P1] Verify RBAC enforcement: organizers can only see their own PENDING events
- [X] [T079] [P2] Add rate limiting for approval endpoints (prevent spam)
- [X] [T080] [P2] Validate JWT token expiration handling in frontend axios interceptors

### Documentation

- [X] [T081] [P2] Update `docs/ARCHITECTURE.md` to document domain layer addition
- [X] [T082] [P2] Update `docs/BACKEND_ARCHITECTURE.md` with EventApprovalService details
- [X] [T083] [P2] Update `docs/FRONTEND_ARCH.md` with api.ts service layer
- [X] [T084] [P3] Add inline documentation (docstrings) to domain service methods
- [X] [T085] [P3] Update `README.md` with new approval workflow feature description

### Performance & Optimization

- [X] [T086] [P2] Add database index validation: `idx_events_status` exists on events.status
- [X] [T087] [P3] Optimize GET /events/pending query with pagination (limit/offset)
- [X] [T088] [P3] Add caching headers for GET /events endpoint
- [X] [T089] [P3] Implement optimistic UI updates for approve/reject actions

**Dependencies**: Phases 3-7 must complete first

---

## Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
Phase 3 (Story 1: Organizer Proposes) ← Can parallelize with Story 2 backend
    ↓
Phase 4 (Story 2: Admin Approves/Rejects)
    ↓
Phase 5 (Story 3: Members Register)
    ↓
Phase 6 (Story 4: Verify Tickets)
    ↓
Phase 7 (Story 5: Walk-in Registration)
    ↓
Phase 8 (Polish & Cross-Cutting)
```

**Parallel Execution Opportunities**:
- T021-T023 (Story 1 backend) can run parallel with T027-T034 (Story 2 backend)
- T024-T026 (Story 1 frontend) can run parallel with T035-T043 (Story 2 frontend) if backend is done
- T071-T075 (Error handling) can start once any phase completes
- T081-T085 (Documentation) can run parallel with Phase 8 implementation

---

## Task Completion Checklist

**Before marking phase complete**:
- [ ] All tasks in phase have passing implementation
- [ ] Backend changes committed with conventional commit message
- [ ] Frontend changes committed with conventional commit message
- [ ] Manual testing performed for user story (if applicable)
- [ ] No console errors in browser (frontend)
- [ ] No unhandled exceptions in logs (backend)

**Story-level acceptance criteria** (from spec.md):
- [ ] Story 1: Organizer can create event → sees PENDING status
- [ ] Story 2: Admin can approve/reject → event status changes correctly
- [ ] Story 3: Member can register for PUBLISHED events → receives QR code
- [ ] Story 4: Organizer can verify tickets → status updates to CHECKED_IN
- [ ] Story 5: Organizer can do walk-in registration → capacity validated

---

## Notes

1. **OpenAPI-First**: Task T004 MUST complete before any API implementation (Principle VI)
2. **Domain Layer**: All business logic goes in `apps/api/src/domain/` per Principle VII
3. **Testing**: Tests are OPTIONAL per spec (not explicitly requested)
4. **Database Migration**: Using delete-recreate strategy for MVP (T012-T015)
5. **Mock API Replacement**: `apps/web/src/services/mockApi.ts` will be replaced by `api.ts`
6. **Error Handling**: Every API call must have loading/error/success states (Principle III)
7. **Branch Protection**: All work on `001-event-approval-system` branch (Principle II)

---

**Total Tasks**: 89 tasks across 8 phases
**Estimated Effort**: 3 days (per docs/3DAY_MVP_PLAN.md)
**Ready for**: Phase 1 execution (T001-T006)

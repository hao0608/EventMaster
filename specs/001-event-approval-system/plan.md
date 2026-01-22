# Implementation Plan: Event Approval System

**Branch**: `001-event-approval-system` | **Date**: 2026-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-event-approval-system/spec.md`

## Summary

Implement a complete event approval workflow system where Organizers create event proposals that enter PENDING status, Admins review and approve/reject events to PUBLISHED/REJECTED status, Members register for approved events receiving QR code tickets, and Organizers verify tickets at check-in with walk-in registration support. This feature extends the existing EventMaster monorepo with status-based workflow, enhanced role-based access control, and complete frontend-backend integration replacing mock APIs.

## Technical Context

**Language/Version**: Python 3.11+ (Backend), TypeScript 5.x (Frontend)
**Primary Dependencies**: FastAPI 0.109+, SQLAlchemy 2.0+, React 18+, Vite 5.x, axios, qrcode.react
**Storage**: SQLite (development), PostgreSQL (production)
**Testing**: pytest + httpx (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Web application (Linux/macOS server, modern browsers)
**Project Type**: Web (monorepo with apps/web frontend + apps/api backend)
**Performance Goals**: <2s event creation, <1s approval actions, <3s registration with QR generation
**Constraints**: <200ms API response p95, support 200 concurrent users, maintain RBAC integrity 100%
**Scale/Scope**: MVP for <200 users, ~8 new API endpoints, ~5 frontend pages modified/created, add domain layer

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Interface-Driven Development ✅ PASS

- **Backend**: Will define Protocol classes for event approval domain services before implementation
- **Frontend**: Will define TypeScript interfaces for all new API responses (EventStatus, PendingEventsResponse, ApprovalActionResponse)
- **API Contracts**: OpenAPI schemas will be defined first (Principle VI compliance)

### Principle II: Branch-Based Development ✅ PASS

- Currently on feature branch `001-event-approval-system`
- All changes will be committed to this branch
- Will create PR to main when feature complete

### Principle III: Comprehensive Error Handling ✅ PASS

- Backend: HTTPException with proper status codes (400 for business logic, 403 for permissions, 404 for not found)
- Frontend: Error boundaries + loading/error/success state management for all API calls
- Input validation at API boundaries (Pydantic schemas)

### Principle IV: Test-Driven Quality ✅ PASS

- Backend: Integration tests for all new approval endpoints, domain service unit tests
- Frontend: Component tests for AdminEventApprovals page, integration tests for approval workflow
- Target: ≥80% coverage for domain logic (event status transitions, RBAC checks)

### Principle V: Low Coupling & Clean Code ✅ PASS

- Domain services will be independent of FastAPI (can be tested without HTTP)
- Single Responsibility: EventApprovalService handles only approval logic
- Keep functions <50 lines, use dependency injection

### Principle VI: OpenAPI-First Development ✅ PASS

- **CRITICAL**: Will update `docs/openapi.yaml` FIRST before any implementation
- New endpoints: GET /events/pending, PATCH /events/{id}/approve, PATCH /events/{id}/reject
- Modified endpoints: POST /events (add status logic), GET /events (add status filtering)
- Contract tests will validate implementation against OpenAPI spec

### Principle VII: Domain-Driven Business Logic ⚠️ ACTION REQUIRED

- **Will create new directory**: `apps/api/src/domain/` for approval workflow logic
- EventApprovalService will handle status transitions, validation, logging
- Routes will only handle HTTP concerns (authentication, request/response transformation)

### Principle VIII: Architectural Compliance ✅ PASS

- Follows existing architecture: Routes → Domain → Models → Database
- Frontend follows: Pages → Services (API) → Components
- Aligns with docs/ARCHITECTURE.md and docs/3DAY_MVP_PLAN.md

### Principle IX: Minimal Code Changes ✅ PASS

- Focus only on approval workflow implementation
- Won't refactor existing auth/registration code unless blocking
- Won't add unrequested features (e.g., email notifications, approval comments beyond what's required)

## Project Structure

### Documentation (this feature)

```text
specs/001-event-approval-system/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Phase 1 data model (Event.status field added)
├── quickstart.md        # Phase 1 developer guide
├── contracts/           # Phase 1 OpenAPI changes
│   └── openapi-changes.yaml
├── checklists/
│   └── requirements.md  # Spec quality validation
└── tasks.md             # Phase 2 (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/
├── web/                          # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Update: Add approval link for Admin
│   │   │   └── ProtectedRoute.tsx # Existing: RBAC enforcement
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # Existing: User state management
│   │   ├── pages/
│   │   │   ├── AdminEventApprovals.tsx  # NEW: Pending events + approve/reject
│   │   │   ├── AdminCreateEvent.tsx     # Update: Admin bypass for status
│   │   │   ├── Events.tsx               # Update: Filter by PUBLISHED only
│   │   │   ├── EventDetail.tsx          # Existing: Registration flow
│   │   │   ├── MyTickets.tsx            # Existing: Display QR codes
│   │   │   └── OrganizerVerify.tsx      # Update: Verify + walk-in tabs
│   │   ├── services/
│   │   │   └── api.ts            # NEW: Replace mockApi with real axios client
│   │   ├── types.ts              # Update: Add EventStatus enum, new interfaces
│   │   └── App.tsx               # Update: Add /admin/approvals route
│   └── package.json              # Add: axios, qrcode.react dependencies
│
└── api/                          # Backend (FastAPI + SQLAlchemy)
    ├── src/
    │   ├── core/
    │   │   ├── config.py         # Existing: Settings
    │   │   ├── security.py       # Existing: JWT utilities
    │   │   └── deps.py           # Existing: RBAC dependencies
    │   ├── domain/               # NEW: Domain services layer
    │   │   ├── __init__.py
    │   │   ├── event_approval.py # NEW: Approval workflow logic
    │   │   └── registration.py   # NEW: Registration + walk-in logic
    │   ├── models/
    │   │   ├── event.py          # UPDATE: Add status field (PENDING/PUBLISHED/REJECTED)
    │   │   ├── user.py           # Existing: User with roles
    │   │   └── registration.py   # Existing: QR codes + statuses
    │   ├── schemas/
    │   │   ├── event.py          # UPDATE: Add status to EventResponse, EventCreate
    │   │   └── approval.py       # NEW: ApprovalActionResponse schema
    │   ├── routes/
    │   │   ├── events.py         # UPDATE: Add /pending, /approve, /reject; modify POST/GET
    │   │   ├── registrations.py  # Existing: Registration endpoints
    │   │   └── checkin.py        # UPDATE: Walk-in registration logic
    │   └── database.py           # Existing: DB session management
    ├── main.py                   # Existing: FastAPI app
    ├── seed_data.py              # UPDATE: Create events with different statuses
    └── requirements.txt          # Existing: Dependencies

docs/
└── openapi.yaml                  # UPDATE: Add new endpoints, modify schemas

tests/                            # Test structure
├── backend/
│   ├── unit/
│   │   └── test_event_approval_domain.py  # NEW: Domain service tests
│   └── integration/
│       └── test_approval_endpoints.py     # NEW: API endpoint tests
└── frontend/
    └── components/
        └── AdminEventApprovals.test.tsx   # NEW: Component tests
```

**Structure Decision**: Web application monorepo structure (Option 2 from template). EventMaster uses `apps/web/` for React frontend and `apps/api/` for FastAPI backend. This feature adds domain layer to backend per Constitution Principle VII and replaces frontend mock API with real axios-based service layer.

## Complexity Tracking

> No constitutional violations requiring justification.


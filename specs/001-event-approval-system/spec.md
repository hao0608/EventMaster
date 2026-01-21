# Feature Specification: Event Approval System

**Feature Branch**: `001-event-approval-system`
**Created**: 2026-01-21
**Status**: Draft
**Input**: User description: "Follow @docs/3DAY_MVP_PLAN.md develop"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Organizer Proposes Event (Priority: P1)

Organizers can create event proposals that are automatically placed in a pending state awaiting administrative approval before becoming publicly visible.

**Why this priority**: This is the entry point for all events in the system. Without this capability, no events can be created and submitted for approval, blocking the entire approval workflow.

**Independent Test**: An organizer can log in, navigate to the event creation form, fill out event details (title, description, date, location, capacity), submit the form, and see confirmation that their event is pending approval. The event should not appear in the public event list until approved.

**Acceptance Scenarios**:

1. **Given** an authenticated user with Organizer role, **When** they create a new event with valid details, **Then** the event is created with status "PENDING" and a confirmation message is displayed
2. **Given** an Organizer has created a pending event, **When** they view their managed events list, **Then** they can see the event marked as "Waiting for Approval"
3. **Given** an authenticated user with Member role, **When** they browse the public event list, **Then** they cannot see events with "PENDING" status
4. **Given** an authenticated user with Admin role, **When** they create a new event, **Then** the event is created with status "PUBLISHED" (admin bypass)

---

### User Story 2 - Admin Reviews and Approves/Rejects Events (Priority: P1)

Administrators can view all pending event proposals, review their details, and either approve them for publication or reject them with the ability to provide feedback.

**Why this priority**: This is the critical gatekeeping function that controls event quality and appropriateness. Without approval capability, pending events remain stuck indefinitely.

**Independent Test**: An admin can log in, navigate to the "Event Approvals" page, see a list of all pending events with their details, click "Approve" on a pending event, and verify the event moves to published status and appears in the public event list.

**Acceptance Scenarios**:

1. **Given** an authenticated user with Admin role, **When** they access the event approvals page, **Then** they see all events with "PENDING" status ordered by creation date
2. **Given** an Admin views a pending event, **When** they click "Approve", **Then** the event status changes to "PUBLISHED" and it becomes visible in the public event list
3. **Given** an Admin views a pending event, **When** they click "Reject", **Then** the event status changes to "REJECTED" and it is removed from the pending list
4. **Given** an event has been approved, **When** an Admin tries to approve it again, **Then** the system shows an error "Event is not pending"
5. **Given** an Organizer's event has been approved, **When** they view their managed events, **Then** the event status shows "Published"

---

### User Story 3 - Members Register for Approved Events (Priority: P2)

Members can browse published events, view event details, register for events they're interested in, and receive a unique QR code ticket for event entry.

**Why this priority**: This enables the core user value proposition - allowing attendees to register and receive tickets. However, it depends on events being approved first (P1 stories).

**Independent Test**: A member can log in, see a list of published events, click on an event to view details, click "Register Now", receive confirmation with a QR code, and view their ticket in the "My Tickets" page showing the QR code and event details.

**Acceptance Scenarios**:

1. **Given** an authenticated Member user, **When** they view the event list, **Then** they see only events with "PUBLISHED" status
2. **Given** a Member views an event detail page, **When** they click "Register Now", **Then** a registration is created with a unique QR code and status "REGISTERED"
3. **Given** a Member has registered for an event, **When** they try to register again, **Then** the system shows "You have already registered for this event"
4. **Given** a Member has registered for an event, **When** they visit "My Tickets" page, **Then** they see the event with a QR code image and registration status
5. **Given** an event is at full capacity, **When** a Member tries to register, **Then** the system shows "Event is at full capacity"

---

### User Story 4 - Organizers Verify Tickets at Event Check-in (Priority: P2)

Organizers can verify attendee tickets at the event entrance by scanning or entering QR codes, marking successful check-ins, and preventing duplicate entries.

**Why this priority**: This completes the event lifecycle but is less critical than approval and registration flows. Events can technically proceed without digital check-in verification.

**Independent Test**: An organizer can log in, navigate to the verification page for their event, enter a valid QR code from a registered attendee's ticket, see confirmation with attendee details, and receive an error when trying to verify the same QR code again.

**Acceptance Scenarios**:

1. **Given** an Organizer for an event, **When** they enter a valid QR code for that event, **Then** the system shows "Check-in successful" with attendee name and event details
2. **Given** a ticket has been verified, **When** the registration status is updated to "CHECKED_IN", **Then** the attendee appears as checked-in on the attendee list
3. **Given** a ticket has already been checked in, **When** the Organizer tries to verify it again, **Then** the system shows "This ticket has already been used"
4. **Given** an Organizer tries to verify a QR code, **When** the QR code is invalid or doesn't exist, **Then** the system shows "Invalid QR code"
5. **Given** an Organizer tries to verify a ticket, **When** the ticket is for a different event they don't manage, **Then** the system shows "You do not have permission to verify this ticket"

---

### User Story 5 - Organizers Register Walk-in Attendees (Priority: P3)

Organizers can manually register attendees who arrive at the event without prior registration by entering their email and name, with the system automatically marking them as checked-in.

**Why this priority**: This is a nice-to-have feature for handling edge cases (forgot to register, last-minute additions) but not essential for MVP functionality.

**Independent Test**: An organizer can access the walk-in registration tab on the verification page, enter an email and display name for a new attendee, submit the form, and see confirmation that the attendee has been registered and marked as checked-in.

**Acceptance Scenarios**:

1. **Given** an Organizer at the event verification page, **When** they enter a new email and name in the walk-in form, **Then** a new registration is created with status "CHECKED_IN"
2. **Given** a walk-in registration is created, **When** the Organizer views the attendee list, **Then** the walk-in attendee appears in the list marked as checked-in
3. **Given** the walk-in email doesn't exist in the system, **When** the Organizer submits the walk-in form, **Then** a new Member account is created automatically
4. **Given** an event is at full capacity, **When** an Organizer tries to add a walk-in attendee, **Then** the system shows "Event is at full capacity"

---

### Edge Cases

- What happens when an Organizer tries to edit or delete an event that is already in PENDING status? (System should allow edits, deletion should require admin approval or be restricted)
- What happens when an Admin approves an event but the organizer has since deleted it? (Should validate event still exists before approval)
- How does the system handle concurrent approval/rejection actions by multiple admins? (First action wins, subsequent actions should fail with "Event is not pending")
- What happens when a Member tries to directly access a PENDING or REJECTED event URL? (Should show 404 or access denied message)
- What happens when an event reaches capacity between when a user views the event and when they click register? (Should fail gracefully with capacity error)
- How does the system handle QR code scanning for cancelled registrations? (Should show "This ticket has been cancelled")
- What happens when an Organizer tries to perform walk-in registration with an email that already has a registration for that event? (Should show error or offer to check-in existing registration)

## Requirements *(mandatory)*

### Functional Requirements

**Event Status Management**:
- **FR-001**: System MUST support three event statuses: PENDING (awaiting approval), PUBLISHED (approved and visible), REJECTED (denied)
- **FR-002**: System MUST automatically assign status "PENDING" when Organizers create events
- **FR-003**: System MUST automatically assign status "PUBLISHED" when Admins create events (admin bypass)
- **FR-004**: System MUST allow only Admins to change event status from PENDING to PUBLISHED or REJECTED
- **FR-005**: System MUST prevent status changes on events that are not in PENDING status

**Event Visibility & Access Control**:
- **FR-006**: System MUST display only PUBLISHED events in the public event list for Members and unauthenticated users
- **FR-007**: System MUST allow Organizers to view their own events regardless of status in the "Managed Events" section
- **FR-008**: System MUST allow Admins to view events in all statuses
- **FR-009**: System MUST prevent Members from accessing PENDING or REJECTED event detail pages

**Event Approval Workflow**:
- **FR-010**: System MUST provide an "Event Approvals" page accessible only to Admins
- **FR-011**: System MUST display all PENDING events on the Event Approvals page ordered by creation date (newest first)
- **FR-012**: System MUST provide "Approve" and "Reject" actions for each pending event
- **FR-013**: System MUST log all approval/rejection actions with admin user ID and timestamp
- **FR-014**: System MUST notify Organizers when their event status changes (via UI indication in managed events list)

**Registration System**:
- **FR-015**: System MUST allow Members to register for PUBLISHED events only
- **FR-016**: System MUST generate a unique QR code token for each registration
- **FR-017**: System MUST prevent duplicate registrations (same user + same event)
- **FR-018**: System MUST enforce event capacity limits during registration
- **FR-019**: System MUST support three registration statuses: REGISTERED, CHECKED_IN, CANCELLED

**Ticket Verification**:
- **FR-020**: System MUST allow Organizers to verify tickets only for events they organize (or any event if Admin)
- **FR-021**: System MUST validate QR code format and existence in database
- **FR-022**: System MUST prevent duplicate check-ins (verification of already CHECKED_IN tickets)
- **FR-023**: System MUST display attendee information (name, event title) upon successful verification
- **FR-024**: System MUST update registration status to CHECKED_IN upon successful verification

**Walk-in Registration**:
- **FR-025**: System MUST allow Organizers to create registrations for their events with status directly set to CHECKED_IN
- **FR-026**: System MUST automatically create Member accounts for walk-in attendees with unknown emails
- **FR-027**: System MUST enforce event capacity limits during walk-in registration
- **FR-028**: System MUST generate QR codes for walk-in registrations (for record-keeping)

### Key Entities

- **Event**: Represents a scheduled activity with approval status
  - Attributes: ID, organizer_id, title, description, start_at, end_at, location, capacity, registered_count, status (PENDING/PUBLISHED/REJECTED)
  - Relationships: Belongs to one User (organizer), has many Registrations

- **Registration**: Represents a user's ticket for an event
  - Attributes: ID, event_id, user_id, status (REGISTERED/CHECKED_IN/CANCELLED), qr_code (unique token), created_at, event_title (denormalized), event_start_at (denormalized)
  - Relationships: Belongs to one Event, belongs to one User

- **User**: Represents system users with role-based permissions
  - Attributes: ID, email, password_hash, display_name, role (MEMBER/ORGANIZER/ADMIN)
  - Relationships: Has many Events (as organizer), has many Registrations

### Assumptions

- Email addresses are used as unique user identifiers
- QR codes are string tokens (UUIDs), not visual image files (images generated client-side)
- Event capacity is a hard limit that cannot be exceeded
- Admins have unrestricted access to all events and verification functions
- Default password for auto-created walk-in accounts is system-generated and can be reset by user
- Event approval decisions are final (no revert to PENDING after approval/rejection)
- Organizers cannot see or interact with other organizers' pending events
- System uses timestamp-based ordering for pending events (creation date)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Organizers can create event proposals and receive confirmation within 2 seconds
- **SC-002**: Admins can view all pending events and approve/reject events with actions completing within 1 second
- **SC-003**: Approved events appear in the public event list immediately (within page refresh)
- **SC-004**: Members can complete event registration and view their QR code ticket within 3 seconds
- **SC-005**: Organizers can verify a valid ticket and receive confirmation within 1 second
- **SC-006**: System prevents duplicate check-ins 100% of the time
- **SC-007**: System enforces event capacity limits with zero exceptions
- **SC-008**: 95% of users can complete their primary task (create/approve/register/verify) on first attempt without errors or confusion
- **SC-009**: All approval actions are logged with admin identity and timestamp for audit trail
- **SC-010**: System maintains proper role-based access control with zero unauthorized access incidents during testing

# OpenAPI Schema Best Practice Fixes

**Status**: 🔴 Pending
**Created**: 2026-01-13
**Priority**: High
**Estimated Effort**: 4-6 hours

---

## Summary

The OpenAPI schema at `docs/openapi.yaml` has several best practice violations that should be fixed before production deployment. This document tracks all required fixes prioritized by impact.

---

## 🔴 Priority 0 - Critical (Must Fix Before Production)

### 1. Inconsistent ID Format (UUID vs Simple Strings)

**Problem**: Schema defines `format: uuid` but examples use simple strings like "e1", "u1", "r1"

**Location**: Lines 609, 578, 742, and similar ID definitions throughout

**Current Code**:
```yaml
id:
  type: string
  format: uuid
  example: e1  # ❌ Not a valid UUID!
```

**Fix Option A** - Use Real UUIDs (Recommended for Production):
```yaml
id:
  type: string
  format: uuid
  example: "550e8400-e29b-41d4-a716-446655440000"
```

**Fix Option B** - Remove UUID Constraint (Only if using short IDs in development):
```yaml
id:
  type: string
  example: "e1"
  # Remove the 'format: uuid' line
```

**Decision Required**: Choose Option A for production-ready schema, or Option B if seed data intentionally uses short IDs.

**Files to Update**:
- All `User.id` references
- All `Event.id` references
- All `Registration.id` references
- All path parameters with UUID format

---

### 2. Missing operationId Fields

**Problem**: No operationIds defined for any endpoint. This blocks:
- Code generation tools (OpenAPI Generator, Swagger Codegen)
- Client SDK generation
- Unique operation identification
- IDE autocomplete for generated clients

**Impact**: Cannot generate type-safe client SDKs

**Fix**: Add operationId to all 16 endpoints

**Suggested Naming Convention** (camelCase, verb + noun):

| Endpoint | Method | operationId |
|----------|--------|-------------|
| `/auth/login` | POST | `loginUser` |
| `/auth/me` | GET | `getCurrentUser` |
| `/events` | GET | `listEvents` |
| `/events` | POST | `createEvent` |
| `/events/managed` | GET | `getManagedEvents` |
| `/events/{eventId}` | GET | `getEvent` |
| `/events/{eventId}` | PATCH | `updateEvent` |
| `/events/{eventId}` | DELETE | `deleteEvent` |
| `/events/{eventId}/registrations` | POST | `registerForEvent` |
| `/events/{eventId}/attendees` | GET | `getEventAttendees` |
| `/me/registrations` | GET | `getMyRegistrations` |
| `/registrations/{registrationId}` | DELETE | `cancelRegistration` |
| `/verify` | POST | `verifyTicket` |
| `/walk-in` | POST | `walkInRegistration` |
| `/users` | GET | `listUsers` |
| `/users/{userId}/role` | PATCH | `updateUserRole` |

**Example Implementation**:
```yaml
/auth/login:
  post:
    operationId: loginUser  # Add this line
    tags:
      - Authentication
    summary: 使用者登入
    # ... rest of the definition
```

---

## 🟡 Priority 1 - Important (Should Fix Soon)

### 3. Non-RESTful Error Handling in /verify Endpoint

**Problem**: Returns `200 OK` for both success and failure (line 408)

**Current Code**:
```yaml
responses:
  '200':
    description: 驗票結果 (成功或失敗皆回傳 200，透過 success 欄位判斷)
```

**Why This Is Bad**:
- Violates HTTP semantics
- Clients must parse response body to determine success
- Breaks HTTP caching and middleware
- Poor developer experience

**Recommended Fix**:
```yaml
responses:
  '200':
    description: 驗票成功 - Ticket verified successfully
    content:
      application/json:
        schema:
          type: object
          required:
            - registration
          properties:
            registration:
              $ref: '#/components/schemas/Registration'
            message:
              type: string
              example: "Check-in successful!"
  '400':
    description: 驗票失敗 - Validation failure
    content:
      application/json:
        schema:
          allOf:
            - $ref: '#/components/schemas/ErrorResponse'
            - type: object
              properties:
                code:
                  type: string
                  enum:
                    - INVALID_QR_CODE
                    - ALREADY_CHECKED_IN
                    - TICKET_CANCELLED
                    - WRONG_EVENT
        examples:
          alreadyCheckedIn:
            value:
              error: "AlreadyCheckedIn"
              message: "此票券已經完成驗票"
              code: "ALREADY_CHECKED_IN"
          invalidQrCode:
            value:
              error: "InvalidQrCode"
              message: "無效的 QR Code"
              code: "INVALID_QR_CODE"
  '404':
    description: QR Code 不存在
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

**⚠️ Note**: This change requires coordinating backend API changes in `apps/api/src/routes/checkin.py`

---

### 4. Inconsistent Pagination

**Problem**: Only `/events` has pagination parameters, but these endpoints don't:
- `GET /users` (line 466)
- `GET /events/managed` (line 172)
- `GET /me/registrations` (line 329)

**Why This Matters**:
- Large result sets can cause performance issues
- Inconsistent API experience
- No way to paginate user lists (admin)

**Fix Step 1**: Create reusable pagination parameter components

```yaml
components:
  parameters:
    LimitParam:
      name: limit
      in: query
      description: Maximum number of items to return per page
      schema:
        type: integer
        default: 20
        minimum: 1
        maximum: 100
      example: 20

    OffsetParam:
      name: offset
      in: query
      description: Number of items to skip (for pagination)
      schema:
        type: integer
        default: 0
        minimum: 0
      example: 0
```

**Fix Step 2**: Apply to all list endpoints

```yaml
/users:
  get:
    parameters:
      - $ref: '#/components/parameters/LimitParam'
      - $ref: '#/components/parameters/OffsetParam'
    responses:
      '200':
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaginatedUserResponse'

/events/managed:
  get:
    parameters:
      - $ref: '#/components/parameters/LimitParam'
      - $ref: '#/components/parameters/OffsetParam'
    # ...

/me/registrations:
  get:
    parameters:
      - $ref: '#/components/parameters/LimitParam'
      - $ref: '#/components/parameters/OffsetParam'
    # ...
```

**Fix Step 3**: Standardize response format

```yaml
components:
  schemas:
    PaginatedUserResponse:
      type: object
      required:
        - items
        - total
        - limit
        - offset
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/User'
        total:
          type: integer
          description: Total count of all items (across all pages)
          example: 150
        limit:
          type: integer
          description: Maximum items per page
          example: 20
        offset:
          type: integer
          description: Number of items skipped
          example: 0
```

**⚠️ Note**: Update `/events` response to match this format (currently uses `events` array instead of `items`)

---

### 5. Mixed Language Documentation

**Problem**: API documentation is in Chinese, but:
- Code is in English (per CLAUDE.md)
- Git commit messages should be in English
- Property names are in English (`displayName`, `startAt`, etc.)

**Options**:

**Option A** - Translate Everything to English (Recommended for International Projects):
```yaml
summary: User Login
description: Authenticate with email and password to receive a JWT access token
```

**Option B** - Maintain Bilingual Documentation:
```yaml
summary: User Login / 使用者登入
description: |
  Authenticate with email and password to receive a JWT access token.

  使用 Email 與密碼進行登入，成功後回傳 JWT Access Token
```

**Option C** - Keep Chinese (If Team is Chinese-Speaking Only):
```yaml
summary: 使用者登入
description: 使用 Email 與密碼進行登入，成功後回傳 JWT Access Token
```

**Decision Required**: Discuss with team and choose one approach consistently.

**Impact**: All descriptions, summaries, error messages throughout the 874-line file

---

## 🟢 Priority 2 - Nice to Have (Future Improvements)

### 6. Missing Complete Request/Response Examples

**Problem**: Individual fields have examples, but no complete request/response examples

**Fix**: Add named examples to key endpoints

**Example for /auth/login**:
```yaml
/auth/login:
  post:
    requestBody:
      content:
        application/json:
          schema:
            # ... existing schema
          examples:
            memberLogin:
              summary: Login as member
              value:
                email: "member@company.com"
                password: "password123"
            organizerLogin:
              summary: Login as organizer
              value:
                email: "org@company.com"
                password: "password123"
    responses:
      '200':
        content:
          application/json:
            examples:
              memberSuccess:
                summary: Member login success
                value:
                  user:
                    id: "550e8400-e29b-41d4-a716-446655440000"
                    email: "member@company.com"
                    displayName: "Alice Member"
                    role: "member"
                  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsImV4cCI6MTYzMjE1MjAwMH0.abc123def456"
```

**Benefits**:
- Better developer experience
- Clear understanding of API contracts
- Easier testing and debugging

**Recommended Endpoints**:
- `/auth/login`
- `POST /events`
- `POST /events/{eventId}/registrations`
- `POST /verify`
- `POST /walk-in`

---

### 7. No API Versioning

**Problem**: Paths don't include version (`/events` instead of `/v1/events`)

**Risk**: Breaking changes in future require new domain or breaking existing clients

**Fix**: Add versioning to server URLs
```yaml
servers:
  - url: https://api.eventmaster.com/v1
    description: Production server (API v1)
  - url: https://staging-api.eventmaster.com/v1
    description: Staging server (API v1)
  - url: http://localhost:8000/v1
    description: Local development server (API v1)
```

**Alternative**: Version in path (less preferred)
```yaml
servers:
  - url: https://api.eventmaster.com
    description: Production server

paths:
  /v1/events:
    get:
      # ...
```

**⚠️ Note**: This requires backend routing changes in `apps/api/main.py`

---

### 8. Missing Metadata Fields

**Problem**: Incomplete API metadata

**Current**:
```yaml
info:
  title: EventMaster API
  version: 1.0.0
  contact:
    name: EventMaster Team
    email: support@eventmaster.com
```

**Fix**:
```yaml
info:
  title: EventMaster API
  version: 1.0.0
  description: |
    EventMaster API provides event registration and check-in management with QR code verification.

    ## Features
    - JWT-based authentication
    - Role-based access control (member, organizer, admin)
    - Event management
    - QR code ticket generation
    - Check-in verification

    ## Rate Limiting
    - 100 requests per minute per user
    - 1000 requests per hour per IP

  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

  contact:
    name: EventMaster Team
    email: support@eventmaster.com
    url: https://eventmaster.com/support

  termsOfService: https://eventmaster.com/terms
```

---

### 9. Missing Staging Environment

**Fix**: Add staging server to servers list

```yaml
servers:
  - url: https://api.eventmaster.com
    description: Production server
  - url: https://staging-api.eventmaster.com
    description: Staging server (for testing)
  - url: http://localhost:8000
    description: Local development server
```

---

### 10. Inconsistent Error Response Examples

**Problem**: Mix of `example:` (singular) and `examples:` (plural) usage

**Bad** (line 374):
```yaml
responses:
  '400':
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
        example:  # Singular - deprecated in OpenAPI 3.0
          error: Cannot cancel
          message: 無法取消已經 Check-in 的票券
```

**Good**:
```yaml
responses:
  '400':
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
        examples:  # Plural - OpenAPI 3.0 standard
          alreadyCheckedIn:
            summary: Cannot cancel checked-in ticket
            value:
              error: "CannotCancel"
              message: "無法取消已經 Check-in 的票券"
          eventStarted:
            summary: Cannot cancel after event started
            value:
              error: "EventStarted"
              message: "活動已開始，無法取消報名"
```

**Apply to**: All error response examples throughout the file

---

## Implementation Checklist

### Phase 1 - Critical Fixes (P0) 🔴
**Estimated Time**: 2 hours
**Must Complete Before**: Production deployment

- [ ] **Task 1.1**: Decide on UUID strategy (real UUIDs vs short IDs)
- [ ] **Task 1.2**: Update all ID field examples consistently
  - [ ] User schema (line 578)
  - [ ] Event schema (line 609)
  - [ ] Registration schema (line 742)
  - [ ] Path parameters (lines 204, 358, 496)
- [ ] **Task 1.3**: Add operationId to all 16 endpoints
  - [ ] Auth endpoints (2)
  - [ ] Event endpoints (6)
  - [ ] Registration endpoints (4)
  - [ ] Check-in endpoints (2)
  - [ ] User endpoints (2)
- [ ] **Task 1.4**: Validate schema with `swagger-cli validate`
- [ ] **Task 1.5**: Generate test client SDK to verify operationIds work

---

### Phase 2 - Important Fixes (P1) 🟡
**Estimated Time**: 2-3 hours
**Must Complete Before**: First external API integration

- [ ] **Task 2.1**: Fix /verify endpoint responses
  - [ ] Update OpenAPI schema
  - [ ] Coordinate with backend developer
  - [ ] Update backend route handler
  - [ ] Update frontend verification page
  - [ ] Test all error scenarios
- [ ] **Task 2.2**: Add pagination to list endpoints
  - [ ] Create reusable parameter components
  - [ ] Create reusable response schemas
  - [ ] Update `/users` endpoint
  - [ ] Update `/events/managed` endpoint
  - [ ] Update `/me/registrations` endpoint
  - [ ] Standardize `/events` response format
- [ ] **Task 2.3**: Language strategy
  - [ ] Decide: English / Bilingual / Chinese
  - [ ] Update all summaries
  - [ ] Update all descriptions
  - [ ] Update error messages
  - [ ] Update examples

---

### Phase 3 - Future Improvements (P2) 🟢
**Estimated Time**: 1-2 hours
**Nice to Have**

- [ ] **Task 3.1**: Add complete request/response examples
  - [ ] `/auth/login`
  - [ ] `POST /events`
  - [ ] `POST /events/{eventId}/registrations`
  - [ ] `POST /verify`
  - [ ] `POST /walk-in`
- [ ] **Task 3.2**: Add API versioning
  - [ ] Update server URLs
  - [ ] OR add version to paths
  - [ ] Update backend routing
- [ ] **Task 3.3**: Add metadata fields
  - [ ] License information
  - [ ] Contact URL
  - [ ] Terms of service
  - [ ] Extended description
  - [ ] Rate limiting info
- [ ] **Task 3.4**: Add staging server
- [ ] **Task 3.5**: Standardize error examples to use `examples:` (plural)

---

## Validation Steps

After making changes, validate the schema:

### 1. Syntax Validation
```bash
# Install validator
npm install -g @apidevtools/swagger-cli

# Validate syntax
swagger-cli validate docs/openapi.yaml
```

### 2. Compare with Actual FastAPI Schema
```bash
cd apps/api
source venv/bin/activate

# Generate actual schema from FastAPI
python -c "
from main import app
import json
with open('/tmp/actual-schema.json', 'w') as f:
    json.dump(app.openapi(), f, indent=2)
"

# Compare with documented schema
# Look for mismatches in endpoints, schemas, or responses
```

### 3. Test Client SDK Generation
```bash
# Install generator
npm install @openapitools/openapi-generator-cli -g

# Generate TypeScript client
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g typescript-axios \
  -o /tmp/test-client

# Check for generation errors
cd /tmp/test-client
npm install
npm run build
```

### 4. Visual Documentation Check
```bash
# Serve interactive docs
npx @redocly/cli preview-docs docs/openapi.yaml
# Open http://localhost:8080 in browser
```

---

## Files to Modify

| File | Changes Required |
|------|------------------|
| `docs/openapi.yaml` | All schema fixes (primary file) |
| `apps/api/src/routes/checkin.py` | Update /verify endpoint responses (if fixing #3) |
| `apps/api/main.py` | Add API versioning prefix (if adding versioning) |
| `apps/web/services/mockApi.ts` | Update frontend to match new API contract |
| `CLAUDE.md` | Update API conventions if needed |

---

## Testing Requirements

After Phase 1 completion:
- [ ] All endpoints have operationId
- [ ] Schema validates with `swagger-cli`
- [ ] Can generate client SDK without errors
- [ ] All IDs use consistent format

After Phase 2 completion:
- [ ] `/verify` returns proper HTTP status codes
- [ ] All list endpoints support pagination
- [ ] Backend tests pass with new responses
- [ ] Frontend adapts to new pagination

---

## Related Documentation

- **OpenAPI Spec**: [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- **Project Guidelines**: `/home/user/EventMaster/CLAUDE.md`
- **API Architecture**: `/home/user/EventMaster/docs/BACKEND_ARCHITECTURE.md`
- **Project Constitution**: `/home/user/EventMaster/.specify/memory/constitution.md`

---

## Notes

- **Breaking Changes**: Items #3 (verify endpoint) and #7 (versioning) require backend changes
- **Coordination Required**: Discuss language strategy (#5) with full team
- **Optional**: P2 items can be deferred to v1.1

---

## Issue Tracking

**GitHub Issue**: [Create issue from this document]

**Branch for Fixes**: `fix/openapi-schema-best-practices`

**Assignee**: [TBD]

**Milestone**: Pre-Production

---

**Last Updated**: 2026-01-13

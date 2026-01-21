<!--
Sync Impact Report:
- Version: 1.0.0 → 1.1.0 (Minor version bump - new principles added)
- Modified principles:
  - None renamed
- Added sections:
  - OpenAPI-First Development (Principle VI)
  - Domain-Driven Business Logic (Principle VII)
  - Architectural Compliance (Principle VIII)
  - Minimal Code Changes (Principle IX)
- Removed sections: None
- Templates requiring updates:
  ✅ spec-template.md - aligned with OpenAPI-first and domain-driven principles
  ✅ plan-template.md - aligned with architecture compliance requirements
  ✅ tasks-template.md - aligned with minimal code change principle
- Follow-up TODOs: None
-->

# EventMaster Constitution

## Core Principles

### I. Interface-Driven Development

All components, services, and modules MUST define clear interfaces before implementation.

**Rules**:
- Backend: Define abstract base classes or Protocol classes for all services
- Frontend: Define TypeScript interfaces for all props, API responses, and data models
- No implementation without a corresponding interface definition
- Interfaces must be documented with docstrings/JSDoc

**Rationale**: Interfaces enforce contracts, enable loose coupling, facilitate testing with mocks, and make code intentions explicit before implementation details.

### II. Branch-Based Development (NON-NEGOTIABLE)

All feature development MUST occur on dedicated feature branches; direct commits to main are prohibited.

**Rules**:
- Every feature/fix gets its own branch: `feature/###-descriptive-name` or `fix/###-issue-description`
- Branch naming MUST include issue/ticket number when applicable
- Main branch is protected and only accepts reviewed pull requests
- Feature branches MUST be up-to-date with main before merge
- Delete feature branches after successful merge

**Rationale**: Branch-based workflow enables parallel development, code review, rollback safety, and clean git history.

### III. Comprehensive Error Handling

All code MUST implement comprehensive error handling with meaningful messages and appropriate error types.

**Rules**:
- Backend: Use FastAPI HTTPException with appropriate status codes and detail messages
- Frontend: Implement error boundaries for React components
- All API calls MUST handle success, error, and loading states
- Log errors with context (user ID, request ID, timestamp, stack trace)
- Never expose internal error details to end users
- Validate inputs at system boundaries (API endpoints, form submissions)

**Rationale**: Robust error handling prevents cascading failures, aids debugging, improves user experience, and ensures system reliability.

### IV. Test-Driven Quality

Tests are mandatory for all critical paths; test coverage MUST be maintained at reasonable levels.

**Rules**:
- Backend: pytest for unit, integration, and API contract tests
- Frontend: Vitest/Jest for unit tests, React Testing Library for component tests
- All API endpoints MUST have integration tests
- Critical business logic MUST have unit tests (≥80% coverage)
- Tests run automatically on PR creation
- Failing tests block merges

**Rationale**: Tests catch regressions early, document behavior, enable confident refactoring, and serve as executable specifications.

### V. Low Coupling & Clean Code

Code MUST maintain low coupling between modules, high cohesion within modules, and prioritize readability.

**Rules**:
- Single Responsibility Principle: Each class/function has one clear purpose
- Dependency Injection: Pass dependencies rather than creating them internally
- Avoid circular dependencies
- Keep functions small (<50 lines preferred)
- Use meaningful variable/function names (no abbreviations unless standard)
- Comment "why" not "what"
- Follow language idioms: Python PEP 8, TypeScript/ESLint standards

**Rationale**: Low coupling enables independent testing and modification, reduces cognitive load, facilitates team collaboration, and improves maintainability.

### VI. OpenAPI-First Development

API development MUST follow the OpenAPI specification (docs/openapi.yaml); any API changes require OpenAPI documentation updates first.

**Rules**:
- All API endpoints MUST be documented in docs/openapi.yaml before implementation
- Backend implementation MUST conform to OpenAPI schemas
- Frontend implementation MUST consume APIs according to OpenAPI contracts
- If OpenAPI documentation is missing or outdated, update documentation BEFORE modifying code
- API contract tests MUST validate implementation against OpenAPI spec

**Rationale**: OpenAPI-first development ensures API consistency across frontend and backend, enables contract testing, facilitates code generation, and serves as authoritative API documentation.

### VII. Domain-Driven Business Logic

All business logic MUST be organized in domain layer; business rules MUST NOT be scattered across routes, controllers, or UI components.

**Rules**:
- Backend: Place all business logic in `src/domain/` directory
- Business logic MUST be independent of delivery mechanism (HTTP, CLI, etc.)
- Routes/controllers MUST only handle HTTP concerns (request/response transformation)
- Domain services MUST be framework-agnostic and testable without HTTP context
- Business rules MUST be encapsulated in domain entities or services

**Rationale**: Domain-driven organization centralizes business rules, enables reuse across different delivery mechanisms, improves testability, and makes business logic explicit and maintainable.

### VIII. Architectural Compliance

All development MUST follow the architecture defined in docs/ARCHITECTURE.md; architectural decisions MUST be documented.

**Rules**:
- Consult ARCHITECTURE.md before implementing features
- Follow defined layering patterns (Routes → Domain → Data Access)
- Follow defined directory structure and file organization
- Respect component boundaries and dependencies
- Document any architectural deviations with rationale
- Update ARCHITECTURE.md when introducing new architectural patterns

**Rationale**: Architectural consistency ensures predictable code organization, reduces cognitive overhead, facilitates onboarding, and prevents architectural erosion.

### IX. Minimal Code Changes

Feature implementation and bug fixes MUST modify only necessary code; unrelated code MUST NOT be changed.

**Rules**:
- Change only files directly required for the feature or fix
- Do NOT refactor unrelated code during feature implementation
- Do NOT add features beyond what was requested
- Do NOT modify code formatting, comments, or structure of unchanged logic
- Separate refactoring into dedicated PRs if needed
- Follow the principle: "If it's not broken and not blocking, don't touch it"

**Rationale**: Minimal changes reduce risk of introducing bugs, simplify code review, make git history clearer, and respect the stability of working code.

## Development Standards

### Technology Stack

**Frontend**:
- Framework: React 18+ with TypeScript
- Build Tool: Vite
- Routing: React Router
- State Management: React Context API (Zustand/Redux only if Context insufficient)
- Styling: CSS Modules or Tailwind CSS
- Testing: Vitest + React Testing Library
- Hosting: Cloudflare Pages

**Backend**:
- Framework: FastAPI (Python 3.11+)
- ORM: SQLAlchemy or Prisma
- Validation: Pydantic models
- Testing: pytest + httpx for API tests
- Authentication: AWS Cognito + JWT
- Hosting: AWS ECS Fargate

**Monorepo Structure**:
```
apps/
├── web/          # React frontend
└── api/          # FastAPI backend
infra/            # Infrastructure as Code
docker/           # Dockerfiles
.specify/         # Feature specifications
tests/            # Shared test utilities
```

### Code Organization

**Backend Services**:
- `domain/`: Business logic and domain services (NEW - per Principle VII)
- `models/`: Database models (SQLAlchemy/Pydantic)
- `routes/`: FastAPI routers and endpoints (HTTP concerns only)
- `schemas/`: Request/response schemas
- `core/`: Core utilities and configuration
- `tests/`: Test files mirroring source structure

**Frontend Structure**:
- `pages/`: Route components
- `components/`: Reusable UI components
- `services/`: API client and data fetching
- `contexts/`: React Context providers
- `types.ts`: TypeScript interface definitions
- `utils/`: Helper functions

### Best Practices

**Python (Backend)**:
- Use type hints for all function signatures
- Async/await for I/O operations
- Pydantic for data validation
- Context managers for resource handling
- Python 3.11+ features (e.g., StrEnum, Self type)

**TypeScript (Frontend)**:
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Functional components with hooks
- Custom hooks for shared logic
- Memoization for expensive computations (React.memo, useMemo, useCallback)

**API Design**:
- RESTful conventions (GET/POST/PUT/DELETE)
- Versioned endpoints (`/api/v1/...`)
- Pagination for list endpoints
- Consistent error response format
- OpenAPI/Swagger documentation (MUST be updated first per Principle VI)

## Quality Gates

### Pre-Commit

- Linting passes (ESLint, Pylint/Ruff)
- Formatting applied (Prettier, Black)
- Type checking passes (TypeScript, mypy)
- No console.log/print statements (use proper logging)

### Pre-Merge (PR Requirements)

- All tests pass
- Code review approved by at least one team member
- No merge conflicts
- Branch up-to-date with main
- Documentation updated if API/interface changed
- No decrease in test coverage
- OpenAPI documentation updated if API changed (per Principle VI)

### Pre-Deployment

- All integration tests pass
- API contract tests pass
- Build succeeds without warnings
- Security scan passes (Snyk/Dependabot)

## Governance

### Amendment Process

This constitution may be amended when:
1. A principle is found to be impractical or counterproductive
2. New technology or patterns warrant principle updates
3. Team consensus agrees on improvement

**Procedure**:
1. Propose amendment in team discussion
2. Document rationale and impact analysis
3. Update constitution with incremented version
4. Propagate changes to all templates
5. Communicate to all team members

### Versioning

**Semantic Versioning (MAJOR.MINOR.PATCH)**:
- **MAJOR**: Backward-incompatible principle removal or redefinition
- **MINOR**: New principle added or significant expansion
- **PATCH**: Clarifications, wording fixes, non-semantic changes

### Compliance

- All PRs MUST be reviewed for constitutional compliance
- Architecture decisions MUST reference relevant principles
- Complexity that violates principles MUST be justified in writing
- Use `.specify/memory/agent-file.md` for runtime development guidance

### Template Synchronization

When constitution changes, these templates MUST be updated:
- `.specify/templates/spec-template.md`: Align requirements with principles
- `.specify/templates/plan-template.md`: Update "Constitution Check" section
- `.specify/templates/tasks-template.md`: Reflect testing and workflow requirements
- `.specify/templates/commands/*.md`: Update command execution workflows

**Version**: 1.1.0 | **Ratified**: 2026-01-09 | **Last Amended**: 2026-01-21

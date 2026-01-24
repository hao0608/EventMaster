# Repository Guidelines

This repository is a monorepo for the EventMaster MVP (FastAPI backend + React
frontend). Use the sections below as the short, repo-specific contributor guide.

## Project Structure & Module Organization

- `apps/web/`: React + Vite frontend. Pages live in `apps/web/pages/`, shared
  UI in `apps/web/components/`, and API calls in `apps/web/services/`.
- `apps/api/`: FastAPI backend. Core modules are under `apps/api/src/` with
  `core/`, `models/`, `schemas/`, and `routes/`. The entrypoint is
  `apps/api/main.py`.
- `docs/`: product and architecture documentation.
- `specs/`: implementation plans and task breakdowns.
- `infra/terraform/`: Terraform modules and environment configs.
- `.github/workflows/`: CI/CD workflows.

## Build, Test, and Development Commands

- `npm run web:dev`: run the frontend dev server from repo root.
- `cd apps/web && npm run build`: production build of the frontend.
- `cd apps/web && npm run preview`: preview the built frontend.
- `cd apps/api && poetry install`: install backend dependencies.
- `cd apps/api && poetry run python seed_data.py`: seed local dev data.
- `cd apps/api && poetry run uvicorn main:app --reload`: run backend locally.
- `cd apps/api && poetry run pytest`: run backend tests (when present).

## Coding Style & Naming Conventions

- Python: 4-space indentation, type hints where practical, and keep FastAPI
  layers in `apps/api/src/` (core/models/schemas/routes).
- TypeScript/React: 2-space indentation, `PascalCase` for components, and
  `useX` naming for hooks.
- No formatter/linter is configured in this repo; match existing code style.

## Testing Guidelines

- Backend uses pytest (declared in `apps/api/pyproject.toml`).
- When adding tests, place them in `apps/api/tests/` with `test_*.py` names.
- No frontend test runner is configured; add scripts/config if introducing one.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (e.g., `feat: add api endpoint`).
- Prefer feature branches and avoid direct commits to `main` (see `CLAUDE.md`).
- PRs should include a clear description, verification steps, and references
  to relevant specs (e.g., `specs/002-dev-deployment-arch/`). Add screenshots
  for UI changes.

## Security & Configuration Tips

- Do not commit secrets. Use `.env.example` files as templates.
- For infra changes, plan Terraform changes before apply in
  `infra/terraform/environments/dev/`.

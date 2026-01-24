# Implementation Plan: 開發環境部署架構 (Dev Environment Deployment Architecture)

**Branch**: `002-dev-deployment-arch` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-dev-deployment-arch/spec.md`

## Summary

建立 EventMaster 的開發環境部署架構，包含：
- **前端**: Cloudflare Pages 自動部署 React/Vite 應用
- **後端**: AWS ECS Fargate 運行 FastAPI 容器，透過 ALB 提供 HTTPS
- **資料庫**: RDS PostgreSQL
- **認證**: AWS Cognito User Pool + Groups (RBAC)
- **網路**: Cloudflare DNS + Proxy → AWS ALB
- **密鑰管理**: AWS Secrets Manager

## Technical Context

**Language/Version**:
- Backend: Python 3.11 (FastAPI 0.109.0)
- Frontend: TypeScript 5.2 (React 18, Vite 5)

**Primary Dependencies**:
- Backend: FastAPI, SQLAlchemy 2.0, python-jose (JWT), passlib (bcrypt)
- Frontend: React 18, React Router 6, Axios
- Infrastructure: AWS (ECS, ALB, RDS, Cognito, Secrets Manager, ECR), Cloudflare (Pages, DNS)

**Storage**:
- RDS PostgreSQL (dev 環境)
- 現有使用 SQLite (需遷移至 PostgreSQL)

**Testing**:
- Backend: pytest + httpx
- Frontend: (待建立)

**Target Platform**:
- Frontend: Cloudflare Pages (全球 CDN)
- Backend: AWS ECS Fargate (單一區域 dev 環境)

**Project Type**: Web Application (Frontend + Backend monorepo)

**Performance Goals**:
- API 回應: 95% < 500ms
- 部署時間: 前端 < 5 分鐘, 後端 < 10 分鐘

**Constraints**:
- Dev 環境: 50 位併發開發者
- 無需 Auto Scaling (固定規格)
- 無需 HA/DR (單一 AZ 即可)

**Scale/Scope**:
- 開發測試環境
- 預期 < 200 併發使用者

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 檔案為模板狀態，無特定專案規範。依據 CLAUDE.md 中的規範：

| Gate | Status | Notes |
|------|--------|-------|
| Branch-Based Development | ✅ PASS | 使用 feature branch `002-dev-deployment-arch` |
| Interface-Driven Development | ✅ PASS | 將定義 API contracts 與 infrastructure interfaces |
| Comprehensive Error Handling | ✅ PASS | 規劃 Circuit Breaker 與健康檢查 |
| Test-Driven Quality | ⚠️ DEFER | 基礎設施測試將於 Phase 1 定義 |
| Low Coupling | ✅ PASS | 前後端分離，透過 API 通訊 |

## Project Structure

### Documentation (this feature)

```text
specs/002-dev-deployment-arch/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (infrastructure entities)
├── quickstart.md        # Phase 1 output (deployment guide)
├── contracts/           # Phase 1 output (API & infra contracts)
│   ├── cognito-config.yaml
│   ├── ecs-task-definition.json
│   └── cloudflare-pages-config.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Existing Structure (monorepo)
apps/
├── api/                 # Backend (FastAPI)
│   ├── src/
│   │   ├── core/        # Config, security, deps
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── routes/      # API endpoints
│   ├── Dockerfile       # Existing, may need updates
│   ├── main.py
│   └── requirements.txt
│
└── web/                 # Frontend (React/Vite)
    ├── src/ (implicit, files at root)
    │   ├── components/
    │   ├── contexts/
    │   ├── pages/
    │   └── services/
    ├── package.json
    └── vite.config.ts

# New Infrastructure-as-Code (to be created)
infra/
├── terraform/           # AWS infrastructure
│   ├── modules/
│   │   ├── vpc/
│   │   ├── ecs/
│   │   ├── rds/
│   │   ├── alb/
│   │   ├── cognito/
│   │   └── secrets/
│   ├── environments/
│   │   └── dev/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── outputs.tf
│   └── backend.tf
│
└── cloudflare/          # Cloudflare configuration
    └── pages-config.yaml

# CI/CD Workflows (to be created)
.github/
└── workflows/
    ├── deploy-frontend.yml
    └── deploy-backend.yml
```

**Structure Decision**: 使用現有的 monorepo 結構 (`apps/api` + `apps/web`)，新增 `infra/` 目錄存放 Terraform IaC，以及 `.github/workflows/` 存放 CI/CD 配置。

## Complexity Tracking

> 無需記錄 - Constitution Check 無違規項目

---

## Phase 0: Research

研究任務已完成，詳見 [research.md](./research.md)

## Phase 1: Design & Contracts

設計產出物：
- [data-model.md](./data-model.md) - 基礎設施實體模型
- [quickstart.md](./quickstart.md) - 部署快速入門指南
- [contracts/](./contracts/) - API 與基礎設施配置契約

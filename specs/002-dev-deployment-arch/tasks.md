# Tasks: 開發環境部署架構 (Dev Environment Deployment Architecture)

**Input**: Design documents from `/specs/002-dev-deployment-arch/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 未明確要求測試，因此不包含測試任務。基礎設施驗證透過手動測試進行。

**Organization**: 任務按 User Story 組織，以便獨立實作與測試。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案，無依賴）
- **[Story]**: 所屬 User Story (US1, US2, US3, US4, US5)
- 描述中包含確切的檔案路徑

## Path Conventions

- **Terraform modules**: `infra/terraform/modules/{module}/`
- **Terraform environment**: `infra/terraform/environments/dev/`
- **Backend**: `apps/api/src/`
- **Frontend**: `apps/web/`
- **CI/CD**: `.github/workflows/`

---

## Phase 1: Setup (Terraform 基礎結構)

**Purpose**: 建立 Terraform 專案結構與基礎模組

- [X] T001 建立 Terraform 專案目錄結構 `infra/terraform/`
- [X] T002 建立 Terraform backend 設定 `infra/terraform/backend.tf`
- [X] T003 [P] 建立 VPC 模組 `infra/terraform/modules/vpc/main.tf`
- [X] T004 [P] 建立 VPC 模組變數 `infra/terraform/modules/vpc/variables.tf`
- [X] T005 [P] 建立 VPC 模組輸出 `infra/terraform/modules/vpc/outputs.tf`
- [X] T006 建立 dev 環境主設定 `infra/terraform/environments/dev/main.tf`
- [X] T007 [P] 建立 dev 環境變數 `infra/terraform/environments/dev/variables.tf`
- [X] T008 [P] 建立 dev 環境輸出 `infra/terraform/environments/dev/outputs.tf`
- [X] T009 [P] 建立 dev 環境 tfvars 範本 `infra/terraform/environments/dev/terraform.tfvars.example`

**Checkpoint**: ✅ Terraform 專案結構就緒，可開始建立各模組

---

## Phase 2: Foundational (共用 AWS 基礎設施)

**Purpose**: 建立所有 User Story 共享的核心 AWS 資源

**⚠️ CRITICAL**: 必須完成此階段才能開始任何 User Story

### 2.1 IAM 與安全性基礎

- [X] T010 建立 IAM 模組 `infra/terraform/modules/iam/main.tf`
- [X] T011 [P] 建立 IAM 模組變數與輸出 `infra/terraform/modules/iam/variables.tf`, `outputs.tf`
- [X] T012 建立 ECS Execution Role 在 IAM 模組
- [X] T013 建立 ECS Task Role 在 IAM 模組
- [X] T014 建立 GitHub Actions OIDC Provider 在 IAM 模組

### 2.2 Secrets Manager

- [X] T015 建立 Secrets 模組 `infra/terraform/modules/secrets/main.tf`
- [X] T016 [P] 建立 Secrets 模組變數與輸出 `infra/terraform/modules/secrets/variables.tf`, `outputs.tf`
- [X] T017 建立 database secret 定義
- [X] T018 建立 app secret 定義

### 2.3 整合至 dev 環境

- [X] T019 整合 VPC 模組至 `infra/terraform/environments/dev/main.tf`
- [X] T020 整合 IAM 模組至 `infra/terraform/environments/dev/main.tf`
- [X] T021 整合 Secrets 模組至 `infra/terraform/environments/dev/main.tf`

**Checkpoint**: ✅ 基礎設施就緒 - 可開始 User Story 實作

---

## Phase 3: User Story 1 - 開發者部署前端應用 (Priority: P1) 🎯 MVP

**Goal**: 開發者推送程式碼後，Cloudflare Pages 自動建置並部署前端應用

**Independent Test**: 推送至 main 分支 → 驗證 Cloudflare Pages 自動觸發建置 → 瀏覽器存取 dev 網址確認

### Implementation for User Story 1

- [X] T022 [US1] 建立 Cloudflare Pages 專案（用戶已完成）
- [X] T023 [US1] 設定 Cloudflare Pages 建置命令（用戶已完成）
- [X] T024 [US1] 設定 Cloudflare Pages 環境變數（用戶已完成）
- [X] T025 [US1] 建立前端部署 workflow `.github/workflows/deploy-frontend.yml`
- [X] T026 [US1] 設定 GitHub Secrets（Cloudflare 整合已完成）
- [~] T027 [US1] 建立 Cloudflare DNS CNAME 記錄（跳過 - 無自訂域名模式）
- [X] T028 [US1] 更新前端環境變數設定 `apps/web/.env.example`
- [ ] T029 [US1] 驗證：推送程式碼至 main 分支，確認自動部署成功

**Checkpoint**: ✅ 前端部署流程完成（用戶已有 Cloudflare Pages 自動部署）

---

## Phase 4: User Story 2 - 開發者部署後端 API 服務 (Priority: P1)

**Goal**: 開發者推送程式碼後，自動建置 Docker 映像檔並部署至 ECS Fargate

**Independent Test**: 推送至 main 分支 → 驗證 ECR 映像檔建置 → ECS 服務更新 → curl API 端點確認

### 4.1 ECR Repository

- [X] T030 [P] [US2] 建立 ECR 模組 `infra/terraform/modules/ecr/main.tf`
- [X] T031 [P] [US2] 建立 ECR 模組變數與輸出 `infra/terraform/modules/ecr/variables.tf`, `outputs.tf`
- [X] T032 [US2] 設定 ECR Lifecycle Policy（保留 10 個映像檔）
- [X] T033 [US2] 整合 ECR 模組至 dev 環境

### 4.2 ALB (Application Load Balancer)

- [X] T034 [P] [US2] 建立 ALB 模組 `infra/terraform/modules/alb/main.tf`
- [X] T035 [P] [US2] 建立 ALB 模組變數與輸出 `infra/terraform/modules/alb/variables.tf`, `outputs.tf`
- [X] T036 [US2] 設定 ALB Security Group (alb-sg)
- [X] T037 [US2] 設定 ALB HTTP Listener (80)（無自訂域名模式，跳過 HTTPS）
- [X] T038 [US2] 設定 ALB Target Group 與健康檢查（/health, interval 30s）
- [~] T039 [US2] 申請 ACM 憑證（跳過 - 無自訂域名模式）
- [X] T040 [US2] 整合 ALB 模組至 dev 環境

### 4.3 ECS Cluster & Service

- [X] T041 [P] [US2] 建立 ECS 模組 `infra/terraform/modules/ecs/main.tf`
- [X] T042 [P] [US2] 建立 ECS 模組變數與輸出 `infra/terraform/modules/ecs/variables.tf`, `outputs.tf`
- [X] T043 [US2] 建立 ECS Cluster (eventmaster-dev)
- [X] T044 [US2] 建立 ECS Task Definition（參考 contracts/ecs-task-definition.json）
- [X] T045 [US2] 設定 ECS Task Secrets Manager 整合
- [X] T046 [US2] 建立 ECS Service 並啟用 Circuit Breaker
- [X] T047 [US2] 設定 ECS Security Group (ecs-tasks-sg)
- [X] T048 [US2] 建立 CloudWatch Log Group (/ecs/eventmaster-api-dev)
- [X] T049 [US2] 整合 ECS 模組至 dev 環境

### 4.4 DNS 與 CI/CD

- [~] T050 [US2] 建立 Cloudflare DNS CNAME 記錄（跳過 - 無自訂域名模式，直接使用 ALB DNS）
- [~] T051 [US2] 啟用 Cloudflare Proxy（跳過 - 無自訂域名模式）
- [X] T052 [US2] 建立後端部署 workflow `.github/workflows/deploy-backend.yml`
- [ ] T053 [US2] 設定 GitHub Secrets（AWS_ROLE_ARN）- 手動操作
- [X] T054 [US2] 更新 Dockerfile（若需要）`apps/api/Dockerfile` - 已確認無需更新
- [X] T055 [US2] 新增健康檢查端點 `/health` 在 `apps/api/main.py`
- [ ] T056 [US2] 驗證：推送程式碼至 main 分支，確認自動部署成功

**Checkpoint**: ✅ 後端部署 Terraform 模組完成（待執行 terraform apply 與設定 GitHub Secret）

---

## Phase 5: User Story 3 - 使用者透過 Cognito 登入系統 (Priority: P1)

**Goal**: 使用者可透過 Cognito 登入並取得 JWT Token，系統根據角色進行 RBAC 授權

**Independent Test**: 使用 Cognito Hosted UI 或 CLI 登入 → 取得 JWT → 呼叫受保護 API 驗證

### 5.1 Cognito User Pool

- [ ] T057 [P] [US3] 建立 Cognito 模組 `infra/terraform/modules/cognito/main.tf`
- [ ] T058 [P] [US3] 建立 Cognito 模組變數與輸出 `infra/terraform/modules/cognito/variables.tf`, `outputs.tf`
- [ ] T059 [US3] 建立 User Pool（參考 contracts/cognito-config.yaml）
- [ ] T060 [US3] 設定密碼政策（min 8, uppercase, lowercase, numbers）
- [ ] T061 [US3] 建立 App Client（無 secret，SPA 用）
- [ ] T062 [US3] 建立 Groups：member, organizer, admin
- [ ] T063 [US3] 整合 Cognito 模組至 dev 環境

### 5.2 後端認證整合

- [ ] T064 [US3] 新增 Cognito 設定至 `apps/api/src/core/config.py`
- [ ] T065 [US3] 新增 JWKS 快取機制 `apps/api/src/core/jwks.py`
- [ ] T066 [US3] 修改 JWT 驗證邏輯 `apps/api/src/core/security.py`（支援 Cognito RS256）
- [ ] T067 [US3] 修改 deps.py 從 cognito:groups claim 提取角色 `apps/api/src/core/deps.py`
- [ ] T068 [US3] 更新後端環境變數（COGNITO_USER_POOL_ID, COGNITO_REGION）

### 5.3 前端認證整合

- [ ] T069 [US3] 安裝 Cognito SDK 套件 `apps/web/package.json`（amazon-cognito-identity-js 或 @aws-amplify/auth）
- [ ] T070 [US3] 建立 Cognito 認證服務 `apps/web/services/cognitoAuth.ts`
- [ ] T071 [US3] 修改 AuthContext 整合 Cognito `apps/web/contexts/AuthContext.tsx`
- [ ] T072 [US3] 修改 Login 頁面使用 Cognito `apps/web/pages/Login.tsx`
- [ ] T073 [US3] 更新前端環境變數（VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID）

### 5.4 驗證

- [ ] T074 [US3] 建立測試使用者（admin, organizer, member）
- [ ] T075 [US3] 驗證：前端登入 → 取得 JWT → 呼叫受保護 API → 確認 RBAC 運作

**Checkpoint**: Cognito 認證整合完成，RBAC 運作正常

---

## Phase 6: User Story 4 - 後端服務存取資料庫 (Priority: P2)

**Goal**: FastAPI 後端服務可安全連線 RDS PostgreSQL，執行資料讀寫

**Independent Test**: ECS 服務啟動 → 連線 RDS 成功 → API 執行 CRUD 操作

### 6.1 RDS PostgreSQL

- [ ] T076 [P] [US4] 建立 RDS 模組 `infra/terraform/modules/rds/main.tf`
- [ ] T077 [P] [US4] 建立 RDS 模組變數與輸出 `infra/terraform/modules/rds/variables.tf`, `outputs.tf`
- [ ] T078 [US4] 建立 RDS Instance（PostgreSQL 15, db.t3.micro）
- [ ] T079 [US4] 設定 RDS Security Group（僅允許 ecs-tasks-sg 存取）
- [ ] T080 [US4] 設定 RDS 於 Private Subnet
- [ ] T081 [US4] 將 RDS 連線資訊存入 Secrets Manager
- [ ] T082 [US4] 整合 RDS 模組至 dev 環境

### 6.2 後端資料庫連線

- [ ] T083 [US4] 修改 config.py 支援從 Secrets Manager 讀取 DATABASE_URL `apps/api/src/core/config.py`
- [ ] T084 [US4] 確認 SQLAlchemy 連線池設定 `apps/api/src/database.py`
- [ ] T085 [US4] 執行 Alembic 資料庫遷移（若有）
- [ ] T086 [US4] 驗證：部署後 API 可正常存取資料庫

**Checkpoint**: RDS 整合完成，後端可執行資料庫操作

---

## Phase 7: User Story 5 - 系統支援企業 SSO 登入 (Priority: P3)

**Goal**: 組織可透過 SAML/OIDC 整合企業 IdP，員工使用公司帳號登入

**Independent Test**: 設定測試 IdP → SSO 登入 → 使用者建立成功 → 取得正確角色

### Implementation for User Story 5

- [ ] T087 [US5] 擴充 Cognito 模組支援 Identity Provider `infra/terraform/modules/cognito/identity_provider.tf`
- [ ] T088 [US5] 建立 SAML/OIDC Identity Provider 設定範本
- [ ] T089 [US5] 設定 Cognito Federation 屬性對應（role mapping）
- [ ] T090 [US5] 修改前端 Login 頁面支援 SSO 登入按鈕 `apps/web/pages/Login.tsx`
- [ ] T091 [US5] 設定 Cognito Hosted UI Callback URLs
- [ ] T092 [US5] 更新文件說明如何整合企業 IdP `specs/002-dev-deployment-arch/quickstart.md`
- [ ] T093 [US5] 驗證：使用測試 IdP 進行 SSO 登入流程

**Checkpoint**: SSO 整合完成，企業使用者可使用公司帳號登入

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨 User Story 的改善與最終驗證

- [ ] T094 [P] 更新 README.md 新增 dev 環境部署說明
- [ ] T095 [P] 更新 CLAUDE.md 新增 Terraform 相關指引
- [ ] T096 完整執行 quickstart.md 驗證所有步驟
- [ ] T097 [P] 清理 Terraform 程式碼（格式化、移除未使用資源）
- [ ] T098 [P] 確認所有 Secrets 已正確設定且無硬編碼
- [ ] T099 驗證 Circuit Breaker：故意部署失敗的映像檔，確認自動回滾
- [ ] T100 驗證 Cloudflare Proxy：確認 DDoS 防護與 WAF 啟用
- [ ] T101 建立 Terraform state 備份策略文件

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS all user stories)
    ↓
┌───────────────────────────────────────────────────────┐
│  User Stories can proceed in parallel after Phase 2   │
├─────────────┬─────────────┬─────────────┬────────────┤
│    US1      │     US2     │     US3     │    US4     │
│  (前端部署)  │  (後端部署)  │  (Cognito)  │   (RDS)    │
│    P1       │     P1      │     P1      │    P2      │
└─────────────┴─────────────┴─────────────┴────────────┘
                       ↓
              ┌───────────────┐
              │     US5       │
              │  (SSO, P3)    │
              │ depends on US3│
              └───────────────┘
                       ↓
              Phase 8: Polish
```

### User Story Dependencies

- **User Story 1 (P1)**: Phase 2 完成後可開始 - 無依賴其他 Story
- **User Story 2 (P1)**: Phase 2 完成後可開始 - 無依賴其他 Story
- **User Story 3 (P1)**: Phase 2 完成後可開始 - 無依賴其他 Story
- **User Story 4 (P2)**: Phase 2 完成後可開始 - 無依賴其他 Story
- **User Story 5 (P3)**: 依賴 US3 (Cognito 需先建立)

### Within Each User Story

- Terraform 模組 → 整合至 dev 環境 → 程式碼修改 → 驗證
- 基礎設施優先於應用程式碼

### Parallel Opportunities

**Phase 1**:
- T003, T004, T005 (VPC 模組) 可平行
- T007, T008, T009 (dev 環境設定) 可平行

**Phase 2**:
- T010, T011 (IAM) 與 T015, T016 (Secrets) 可平行

**Phase 3-7**:
- US1, US2, US3, US4 在 Phase 2 完成後可平行進行
- 各 User Story 內的 Terraform 模組可平行建立

---

## Parallel Example: Phase 4 (User Story 2)

```bash
# 可平行建立的 Terraform 模組：
Task: "建立 ECR 模組 infra/terraform/modules/ecr/main.tf"
Task: "建立 ALB 模組 infra/terraform/modules/alb/main.tf"
Task: "建立 ECS 模組 infra/terraform/modules/ecs/main.tf"

# 整合至 dev 環境後，可平行進行：
Task: "建立 Cloudflare DNS CNAME 記錄"
Task: "建立後端部署 workflow .github/workflows/deploy-backend.yml"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 + 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (前端部署)
4. Complete Phase 4: US2 (後端部署)
5. Complete Phase 5: US3 (Cognito 認證)
6. **STOP and VALIDATE**: 端到端驗證前後端部署與認證
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 基礎設施就緒
2. US1 (前端) → 前端可存取 (MVP-1)
3. US2 (後端) → API 可存取 (MVP-2)
4. US3 (認證) → 完整認證流程 (MVP-3)
5. US4 (資料庫) → 資料持久化
6. US5 (SSO) → 企業整合

### Parallel Team Strategy

With 3 developers:

1. 團隊完成 Setup + Foundational
2. Foundational 完成後：
   - Developer A: User Story 1 (前端)
   - Developer B: User Story 2 (後端)
   - Developer C: User Story 3 (認證)
3. 待 P1 Stories 完成後：
   - Developer A: User Story 4 (資料庫)
   - Developer B: User Story 5 (SSO)
   - Developer C: Polish

---

## Notes

- [P] tasks = 不同檔案，無依賴
- [Story] label 對應 spec.md 中的 User Story
- 每個 User Story 應可獨立完成與測試
- Terraform 變更需經過 `terraform plan` 確認後再 `apply`
- 敏感資訊使用 Secrets Manager 或 GitHub Secrets
- 避免：模糊任務、同檔案衝突、破壞 Story 獨立性的跨 Story 依賴

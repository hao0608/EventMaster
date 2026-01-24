# Feature Specification: 開發環境部署架構 (Dev Environment Deployment Architecture)

**Feature Branch**: `002-dev-deployment-arch`
**Created**: 2026-01-23
**Status**: Draft
**Input**: 開發環境部署架構 - Cloudflare Pages 前端 → AWS ALB → ECS Fargate FastAPI → RDS PostgreSQL，搭配 Cognito 認證

## Clarifications

### Session 2026-01-23

- Q: 使用者角色 (member/organizer/admin) 應如何管理與儲存？ → A: 使用 Cognito Groups（角色作為 Group，自動加入 JWT cognito:groups claim）
- Q: API 子網域是否啟用 Cloudflare Proxy（橘雲）？ → A: 啟用 Proxy，流量經 Cloudflare 獲得 DDoS 防護與 WAF
- Q: 機敏資料（資料庫密碼、API 金鑰等）如何管理？ → A: 使用 AWS Secrets Manager，原生整合 ECS，透過 IAM 控制存取
- Q: ECS 部署失敗時的回滾策略為何？ → A: 使用 ECS Deployment Circuit Breaker，部署失敗自動回滾到前一版本

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 開發者部署前端應用 (Priority: P1)

開發者將前端程式碼推送到 Git 儲存庫後，系統自動建置並部署到 Cloudflare Pages，使用者可透過 dev 環境網址存取最新版本的前端應用。

**Why this priority**: 前端是使用者的入口點，沒有可存取的前端，整個系統無法使用。這是最基本的部署需求。

**Independent Test**: 可透過推送程式碼到指定分支，驗證 Cloudflare Pages 是否自動觸發建置並成功部署，最終透過瀏覽器存取 dev 網址確認。

**Acceptance Scenarios**:

1. **Given** 開發者有程式碼變更, **When** 推送到 dev 分支, **Then** Cloudflare Pages 自動觸發建置流程
2. **Given** 建置成功完成, **When** 使用者存取 dev 網址, **Then** 可看到最新版本的前端介面
3. **Given** 建置失敗, **When** 開發者查看部署日誌, **Then** 可看到清楚的錯誤訊息

---

### User Story 2 - 開發者部署後端 API 服務 (Priority: P1)

開發者將後端程式碼推送後，系統自動建置 Docker 映像檔並部署到 AWS ECS Fargate，API 服務可透過 ALB 對外提供 HTTPS 存取。

**Why this priority**: 後端 API 是前端所有功能的基礎，與前端部署同等重要。

**Independent Test**: 可透過推送後端程式碼，驗證 Docker 映像檔建置、推送到 ECR、ECS 服務更新，最終透過 API 端點確認服務運作。

**Acceptance Scenarios**:

1. **Given** 開發者有後端程式碼變更, **When** 推送到 dev 分支, **Then** CI/CD 自動建置 Docker 映像檔
2. **Given** Docker 映像檔建置成功, **When** 部署到 ECS Fargate, **Then** 服務在 60 秒內完成健康檢查
3. **Given** API 服務運行中, **When** 透過 ALB 發送 HTTPS 請求, **Then** 收到正確的 API 回應
4. **Given** 部署失敗, **When** 查看 CloudWatch 日誌, **Then** 可找到錯誤原因

---

### User Story 3 - 使用者透過 Cognito 登入系統 (Priority: P1)

使用者可透過 AWS Cognito User Pool 進行身份驗證，登入後取得 JWT Token，系統根據 Token 中的角色資訊進行權限控制 (RBAC)。

**Why this priority**: 認證是系統安全性的基礎，所有需要權限的操作都依賴此功能。

**Independent Test**: 可透過 Cognito 登入流程取得 JWT，並使用該 Token 呼叫受保護的 API 端點驗證。

**Acceptance Scenarios**:

1. **Given** 使用者有有效帳號, **When** 透過前端輸入帳密登入, **Then** 成功取得 JWT Access Token
2. **Given** 使用者持有有效 JWT, **When** 呼叫受保護的 API, **Then** 根據角色取得對應權限的資源
3. **Given** 使用者 JWT 過期, **When** 呼叫受保護的 API, **Then** 收到 401 未授權回應
4. **Given** 使用者角色為 member, **When** 嘗試存取 organizer 專屬功能, **Then** 收到 403 禁止存取回應

---

### User Story 4 - 後端服務存取資料庫 (Priority: P2)

FastAPI 後端服務可安全地連線到 RDS PostgreSQL 資料庫，執行資料的讀寫操作。

**Why this priority**: 資料持久化是核心功能，但可以在基本部署架構建立後再設定。

**Independent Test**: 可透過 API 端點執行資料庫操作（如建立活動），驗證資料是否正確寫入並可讀取。

**Acceptance Scenarios**:

1. **Given** ECS 服務運行中, **When** 服務啟動時連線資料庫, **Then** 連線成功建立
2. **Given** 資料庫連線正常, **When** API 執行寫入操作, **Then** 資料正確存入資料庫
3. **Given** 資料庫連線中斷, **When** API 收到請求, **Then** 回傳適當的錯誤訊息而非崩潰

---

### User Story 5 - 系統支援企業 SSO 登入 (Priority: P3)

組織可透過 SAML 或 OIDC 協定整合企業身份提供者 (IdP)，讓員工使用公司帳號登入 EventMaster。

**Why this priority**: 企業 SSO 是進階需求，可在基本認證機制運作後再整合。

**Independent Test**: 可透過設定 Cognito Federation 與測試 IdP 整合，驗證 SSO 登入流程。

**Acceptance Scenarios**:

1. **Given** 已設定企業 IdP 整合, **When** 使用者選擇 SSO 登入, **Then** 重導向至企業登入頁面
2. **Given** 企業 IdP 驗證成功, **When** 回到 EventMaster, **Then** 使用者已登入並取得正確角色
3. **Given** 新的 SSO 使用者首次登入, **When** 完成驗證, **Then** 系統自動建立對應的使用者帳號

---

### Edge Cases

- 當 Cloudflare Pages 建置失敗時，如何通知開發者並提供 rollback 機制？
- 當 ECS 服務健康檢查失敗時，如何自動回滾到上一個健康版本？
- 當 RDS 資料庫連線數達到上限時，系統如何處理新的連線請求？
- 當 Cognito Token 驗證服務暫時無法連線時，已登入使用者的請求如何處理？
- 當 ALB 偵測到後端服務全部不健康時，如何回應使用者請求？

## Requirements *(mandatory)*

### Functional Requirements

**前端部署 (Cloudflare Pages)**
- **FR-001**: 系統 MUST 支援從 Git 儲存庫自動觸發前端建置與部署
- **FR-002**: 系統 MUST 提供 dev 環境專屬的網址供開發測試使用
- **FR-003**: 系統 MUST 支援環境變數設定（如 API 端點網址）
- **FR-004**: 系統 MUST 提供建置日誌供除錯使用

**後端部署 (AWS ECS Fargate)**
- **FR-005**: 系統 MUST 支援 Docker 容器化部署
- **FR-006**: 系統 MUST 透過 ALB 提供 HTTPS 端點
- **FR-007**: 系統 MUST 支援服務健康檢查與自動重啟，並啟用 ECS Deployment Circuit Breaker 於部署失敗時自動回滾
- **FR-008**: 系統 MUST 透過 AWS Secrets Manager 管理機敏資料（資料庫連線字串、API 金鑰等），ECS Task 透過 IAM Role 存取
- **FR-009**: 系統 MUST 提供容器日誌供監控與除錯

**DNS 與網路**
- **FR-010**: 系統 MUST 透過 Cloudflare DNS 管理 dev 環境網域
- **FR-011**: 系統 MUST 支援 API 子網域指向 AWS ALB，啟用 Cloudflare Proxy（橘雲）以獲得 DDoS 防護與 WAF
- **FR-012**: 系統 MUST 全程使用 HTTPS 加密傳輸

**資料庫 (RDS PostgreSQL)**
- **FR-013**: 系統 MUST 提供 PostgreSQL 資料庫供後端服務使用
- **FR-014**: 系統 MUST 限制資料庫僅能從 ECS 服務所在的 VPC 存取
- **FR-015**: 系統 MUST 支援資料庫連線池管理

**認證與授權 (AWS Cognito)**
- **FR-016**: 系統 MUST 支援使用者帳號密碼登入
- **FR-017**: 系統 MUST 核發 JWT Token 供 API 認證使用
- **FR-018**: 系統 MUST 支援角色型存取控制 (RBAC)，透過 Cognito Groups 管理 member、organizer、admin 三種角色，角色資訊自動包含於 JWT cognito:groups claim
- **FR-019**: 系統 MUST 支援 JWT Token 驗證與過期處理
- **FR-020**: 系統 SHOULD 支援 SAML/OIDC Federation 整合企業 IdP（可選）

**快取 (ElastiCache Redis) - 可選**
- **FR-021**: 系統 MAY 提供 Redis 快取服務以提升效能
- **FR-022**: 若啟用 Redis，系統 MUST 限制僅能從 ECS 服務所在的 VPC 存取

### Key Entities

- **Environment (環境)**: 代表一個部署環境（dev、staging、prod），包含該環境的所有資源設定
- **Service (服務)**: 代表一個可部署的應用程式單元（前端、後端 API），包含版本資訊與健康狀態
- **User Pool (使用者池)**: Cognito 中管理使用者身份的容器，包含使用者帳號、密碼政策、Token 設定
- **Identity Provider (身份提供者)**: 外部的 SAML/OIDC 認證服務，可整合至 Cognito Federation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 前端程式碼推送後，5 分鐘內完成建置與部署，使用者可存取新版本
- **SC-002**: 後端程式碼推送後，10 分鐘內完成建置、部署與健康檢查
- **SC-003**: API 端點在正常負載下，95% 的請求在 500ms 內回應
- **SC-004**: 使用者登入流程（從輸入帳密到取得 JWT）在 3 秒內完成
- **SC-005**: 系統可同時支援至少 50 位開發者進行測試，不影響效能
- **SC-006**: 部署失敗時，開發者在 1 分鐘內收到通知
- **SC-007**: 服務異常時，自動重啟在 2 分鐘內完成

## Assumptions

- Cloudflare 帳號已建立且有權限管理 DNS 與 Pages
- AWS 帳號已建立且有權限建立 ECS、ALB、RDS、Cognito 等資源
- 已有可用的網域名稱並已設定至 Cloudflare DNS
- 現有的 EventMaster 程式碼已支援 Docker 容器化（Dockerfile 存在）
- 現有的 JWT 認證邏輯可調整為支援 Cognito 核發的 Token
- Dev 環境資料可定期清除，不需要正式環境的備份策略

## Out of Scope

- 正式環境 (Production) 的高可用性架構設計
- 自動擴展 (Auto Scaling) 設定
- 災難復原 (DR) 計畫
- 成本最佳化策略
- CI/CD Pipeline 的詳細實作（假設使用 GitHub Actions，但詳細腳本另案處理）
- 監控告警系統的詳細設定（如 CloudWatch Alarms）

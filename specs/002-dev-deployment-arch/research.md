# Research: 開發環境部署架構

**Feature**: 002-dev-deployment-arch
**Date**: 2026-01-23

## 1. AWS Cognito 與 FastAPI 整合

### Decision
使用 `python-jose` 驗證 Cognito 發行的 JWT Token，透過 JWKS (JSON Web Key Set) 驗證簽名。

### Rationale
- Cognito 使用 RS256 演算法簽發 JWT，需要公鑰驗證
- `python-jose` 已在專案中使用，支援 JWKS 驗證
- 無需額外安裝套件，僅需調整驗證邏輯

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| AWS SDK (boto3) 驗證 | 需要額外網路請求，增加延遲 |
| 自行下載 JWKS 並快取 | 增加複雜度，但為推薦做法 |

### Implementation Notes
```python
# Cognito JWKS URL 格式
JWKS_URL = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"

# 需修改 apps/api/src/core/security.py
# 1. 新增 JWKS 快取機制
# 2. 修改 decode_access_token() 使用 RS256 + JWKS
# 3. 從 JWT claims 提取 cognito:groups 作為角色
```

---

## 2. ECS Fargate + ALB 配置

### Decision
使用 ECS Fargate 搭配 Application Load Balancer，啟用 Circuit Breaker 自動回滾。

### Rationale
- Fargate 無需管理 EC2 主機，適合小型 dev 環境
- ALB 支援 HTTPS 終止、健康檢查、路徑路由
- Circuit Breaker 是 ECS 原生功能，無需額外設定 CodeDeploy

### Configuration Details

**ECS Service 配置**:
- Launch Type: FARGATE
- CPU: 256 (0.25 vCPU)
- Memory: 512 MB
- Desired Count: 1 (dev 環境)
- Deployment Circuit Breaker: Enabled with rollback

**ALB 配置**:
- Scheme: internet-facing
- Listeners: HTTPS (443) → Target Group (8000)
- Health Check: GET /health, interval 30s, threshold 3

**Task Definition 重點**:
```json
{
  "containerDefinitions": [{
    "name": "eventmaster-api",
    "image": "${ECR_REPO}:latest",
    "portMappings": [{"containerPort": 8000}],
    "secrets": [
      {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
      {"name": "SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/eventmaster-api-dev",
        "awslogs-region": "${AWS_REGION}",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
```

---

## 3. Cloudflare Pages 與 Vite 配置

### Decision
使用 Cloudflare Pages 的 Git 整合自動部署 Vite 專案。

### Rationale
- Cloudflare Pages 原生支援 Vite 建置
- 自動 HTTPS、全球 CDN、免費方案足夠 dev 使用
- 環境變數可在 Pages Dashboard 設定

### Configuration Details

**Build Settings**:
- Framework preset: Vite
- Build command: `cd apps/web && npm ci && npm run build`
- Build output directory: `apps/web/dist`
- Root directory: `/` (monorepo root)

**Environment Variables**:
```
VITE_API_BASE_URL=https://api-dev.eventmaster.example.com
VITE_COGNITO_USER_POOL_ID=<from_terraform_output>
VITE_COGNITO_CLIENT_ID=<from_terraform_output>
VITE_COGNITO_REGION=ap-northeast-1
```

**Branch Deployment**:
- Production branch: `main` → `dev.eventmaster.example.com`
- Preview branches: 自動產生預覽 URL

---

## 4. RDS PostgreSQL 配置

### Decision
使用 RDS PostgreSQL (db.t3.micro) 單一 AZ 部署，無 Multi-AZ。

### Rationale
- Dev 環境不需要高可用性
- t3.micro 足夠開發測試使用
- 可隨時升級至 Multi-AZ 供 staging/prod 使用

### Configuration Details

**Instance 配置**:
- Engine: PostgreSQL 15
- Instance Class: db.t3.micro
- Storage: 20 GB gp3
- Multi-AZ: No
- Public Access: No (僅 VPC 內部存取)

**Security Group**:
- Inbound: PostgreSQL (5432) from ECS Security Group only

**連線字串格式**:
```
postgresql://eventmaster:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/eventmaster_dev
```

---

## 5. AWS Secrets Manager 配置

### Decision
將資料庫密碼、JWT Secret Key 等機敏資料存於 Secrets Manager，ECS Task 透過 IAM Role 存取。

### Rationale
- 原生整合 ECS Task Definition
- 支援自動輪換（可選）
- 透過 IAM Policy 細粒度控制存取

### Secret Structure

```json
// Secret: eventmaster/dev/database
{
  "username": "eventmaster",
  "password": "<generated>",
  "host": "<rds_endpoint>",
  "port": "5432",
  "database": "eventmaster_dev"
}

// Secret: eventmaster/dev/app
{
  "SECRET_KEY": "<generated_jwt_secret>",
  "COGNITO_USER_POOL_ID": "<user_pool_id>",
  "COGNITO_CLIENT_ID": "<client_id>"
}
```

**ECS Task Role Policy**:
```json
{
  "Effect": "Allow",
  "Action": ["secretsmanager:GetSecretValue"],
  "Resource": ["arn:aws:secretsmanager:*:*:secret:eventmaster/dev/*"]
}
```

---

## 6. Cloudflare DNS + Proxy 配置

### Decision
API 子網域啟用 Cloudflare Proxy (橘雲)，DNS 指向 ALB。

### Rationale
- 獲得 DDoS 防護與 WAF
- 隱藏真實 ALB IP
- 可使用 Cloudflare SSL/TLS 設定

### Configuration Details

**DNS Records**:
```
api-dev.eventmaster.example.com  CNAME  <alb_dns_name>  Proxied (橘雲)
dev.eventmaster.example.com      CNAME  <pages_url>     Proxied (橘雲)
```

**SSL/TLS 設定**:
- Mode: Full (strict)
- Always Use HTTPS: On
- Minimum TLS Version: 1.2

**Firewall Rules** (可選):
- Rate Limiting: 100 requests/minute per IP
- Block known bad bots

---

## 7. GitHub Actions CI/CD

### Decision
使用 GitHub Actions 實現 CI/CD，前後端分開 workflow。

### Rationale
- 專案已使用 GitHub，Actions 整合最便利
- 可分別觸發前後端部署
- 支援 OIDC 認證連接 AWS，無需長期憑證

### Workflow Structure

**deploy-frontend.yml**:
- Trigger: push to `main` (apps/web/** changed)
- Steps: Checkout → Cloudflare Pages Deploy (wrangler)

**deploy-backend.yml**:
- Trigger: push to `main` (apps/api/** changed)
- Steps:
  1. Checkout
  2. Configure AWS Credentials (OIDC)
  3. Login to ECR
  4. Build & Push Docker Image
  5. Update ECS Service

**Secrets Required**:
- `AWS_ROLE_ARN` (OIDC role for GitHub Actions)
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

---

## 8. 現有程式碼調整

### Decision
最小化程式碼變更，主要調整認證邏輯與環境變數讀取。

### Changes Required

**apps/api/src/core/security.py**:
- 新增 Cognito JWKS 驗證邏輯
- 支援 RS256 演算法
- 從 `cognito:groups` claim 提取角色

**apps/api/src/core/config.py**:
- 新增 Cognito 相關設定
- 支援從 Secrets Manager 讀取（透過 ECS 環境變數注入）

**apps/api/Dockerfile**:
- 無需修改，現有配置已適用

**apps/web/services/api.ts** (或 mockApi.ts):
- 調整 API base URL 從環境變數讀取
- 整合 Cognito 認證 SDK (aws-amplify 或 amazon-cognito-identity-js)

---

## Summary

| Area | Decision | Key Files |
|------|----------|-----------|
| 認證 | Cognito + JWKS 驗證 | `security.py`, `config.py` |
| 後端部署 | ECS Fargate + ALB + Circuit Breaker | `infra/terraform/modules/ecs/` |
| 前端部署 | Cloudflare Pages | `.github/workflows/deploy-frontend.yml` |
| 資料庫 | RDS PostgreSQL t3.micro | `infra/terraform/modules/rds/` |
| 密鑰管理 | Secrets Manager | `infra/terraform/modules/secrets/` |
| DNS | Cloudflare Proxy | `infra/cloudflare/` |
| CI/CD | GitHub Actions + OIDC | `.github/workflows/` |

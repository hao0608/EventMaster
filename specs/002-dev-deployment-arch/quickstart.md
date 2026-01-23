# Quickstart: 開發環境部署指南

**Feature**: 002-dev-deployment-arch
**Date**: 2026-01-23

此指南說明如何從零開始部署 EventMaster 開發環境。

---

## Prerequisites

### 帳號與存取權限

- [ ] **AWS Account** - 具有以下服務權限：
  - ECS, ECR, ALB, RDS, Cognito, Secrets Manager, IAM, VPC, CloudWatch
- [ ] **Cloudflare Account** - 具有以下權限：
  - DNS 管理、Pages 管理
- [ ] **GitHub Account** - 具有 Repository 寫入權限

### 工具安裝

```bash
# Terraform (>= 1.5)
brew install terraform

# AWS CLI (>= 2.0)
brew install awscli

# Docker (for local testing)
brew install docker

# Node.js (>= 18) for frontend
brew install node

# Python (>= 3.11) for backend
brew install python@3.11
```

### 網域準備

- [ ] 擁有網域 (e.g., `eventmaster.example.com`)
- [ ] 網域已設定至 Cloudflare DNS

---

## Step 1: AWS 基礎設施部署

### 1.1 初始化 Terraform

```bash
cd infra/terraform/environments/dev

# 初始化 Terraform
terraform init

# 檢視執行計畫
terraform plan -out=tfplan

# 執行部署 (需確認)
terraform apply tfplan
```

### 1.2 記錄輸出值

Terraform 完成後，記錄以下輸出值：

```bash
terraform output
```

| Output | 用途 |
|--------|------|
| `alb_dns_name` | Cloudflare DNS 設定 |
| `cognito_user_pool_id` | 前端/後端設定 |
| `cognito_client_id` | 前端設定 |
| `ecr_repository_url` | CI/CD 設定 |
| `rds_endpoint` | 已存於 Secrets Manager |

---

## Step 2: Cloudflare 設定

### 2.1 設定 DNS Records

在 Cloudflare Dashboard → DNS → Records：

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `api-dev` | `<alb_dns_name>` | Proxied (橘雲) |

### 2.2 設定 Cloudflare Pages

1. 前往 Cloudflare Dashboard → Pages
2. Create a project → Connect to Git
3. 選擇 EventMaster repository
4. 設定 Build settings：

| Setting | Value |
|---------|-------|
| Framework preset | Vite |
| Build command | `cd apps/web && npm ci && npm run build` |
| Build output directory | `apps/web/dist` |
| Root directory | `/` |

5. 設定 Environment variables：

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://api-dev.eventmaster.example.com` |
| `VITE_COGNITO_USER_POOL_ID` | `<from_terraform_output>` |
| `VITE_COGNITO_CLIENT_ID` | `<from_terraform_output>` |
| `VITE_COGNITO_REGION` | `ap-northeast-1` |

6. 設定 Custom domain → `dev.eventmaster.example.com`

---

## Step 3: GitHub Actions 設定

### 3.1 建立 OIDC Provider (一次性)

```bash
# 在 AWS Console 或 CLI 建立 OIDC Provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 3.2 建立 IAM Role for GitHub Actions

使用 Terraform 或手動建立，信任策略如下：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<ORG>/<REPO>:*"
        }
      }
    }
  ]
}
```

### 3.3 設定 GitHub Secrets

在 Repository → Settings → Secrets and variables → Actions：

| Secret | Value |
|--------|-------|
| `AWS_ROLE_ARN` | `arn:aws:iam::<ACCOUNT_ID>:role/github-actions-deploy` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (Pages 權限) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

---

## Step 4: 初始部署

### 4.1 建立 Cognito 測試使用者

```bash
# 建立 admin 使用者
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com \
  --temporary-password "TempPass123!"

# 將使用者加入 admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username admin@example.com \
  --group-name admin
```

### 4.2 首次後端部署

```bash
# 本地建置並推送 Docker Image
cd apps/api

# 登入 ECR
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin <ECR_REPO_URL>

# 建置並推送
docker build -t eventmaster-api .
docker tag eventmaster-api:latest <ECR_REPO_URL>:latest
docker push <ECR_REPO_URL>:latest

# 更新 ECS Service (觸發部署)
aws ecs update-service \
  --cluster eventmaster-dev \
  --service eventmaster-api \
  --force-new-deployment
```

### 4.3 首次前端部署

推送程式碼至 main branch 即會自動觸發 Cloudflare Pages 部署。

```bash
git push origin main
```

---

## Step 5: 驗證部署

### 5.1 API 健康檢查

```bash
curl https://api-dev.eventmaster.example.com/health
# Expected: {"status": "healthy"}
```

### 5.2 前端存取

開啟瀏覽器：`https://dev.eventmaster.example.com`

### 5.3 認證測試

```bash
# 取得 Access Token
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id <USER_POOL_ID> \
  --client-id <CLIENT_ID> \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=admin@example.com,PASSWORD=<PASSWORD> \
  --query 'AuthenticationResult.AccessToken' --output text)

# 測試受保護 API
curl -H "Authorization: Bearer $TOKEN" \
  https://api-dev.eventmaster.example.com/auth/me
```

---

## Troubleshooting

### ECS Task 無法啟動

1. 檢查 CloudWatch Logs：
   ```bash
   aws logs tail /ecs/eventmaster-api-dev --follow
   ```

2. 檢查 Task 狀態：
   ```bash
   aws ecs describe-tasks \
     --cluster eventmaster-dev \
     --tasks <TASK_ARN>
   ```

### RDS 連線失敗

1. 確認 Security Group 設定正確
2. 檢查 Secrets Manager 中的連線字串
3. 確認 ECS Task 在正確的 VPC/Subnet 中運行

### Cloudflare Pages 建置失敗

1. 檢查 Build logs 在 Cloudflare Dashboard
2. 確認 Build command 正確
3. 確認環境變數已設定

---

## 維護指令

### 手動觸發後端部署

```bash
aws ecs update-service \
  --cluster eventmaster-dev \
  --service eventmaster-api \
  --force-new-deployment
```

### 查看部署狀態

```bash
aws ecs describe-services \
  --cluster eventmaster-dev \
  --services eventmaster-api \
  --query 'services[0].deployments'
```

### 資料庫遷移

```bash
# 連線至 RDS (透過 bastion 或 ECS exec)
aws ecs execute-command \
  --cluster eventmaster-dev \
  --task <TASK_ARN> \
  --container eventmaster-api \
  --interactive \
  --command "/bin/sh"

# 執行遷移
alembic upgrade head
```

---

## 環境銷毀

```bash
cd infra/terraform/environments/dev
terraform destroy
```

**注意**: 這將刪除所有 AWS 資源，包括 RDS 資料。如需保留資料，請先建立 snapshot。

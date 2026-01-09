# Event Master Registration System

企業活動報名系統 - Monorepo

## 系統架構

### 前端（Frontend）
- **Domain**: `app.example.com`
- **Tech Stack**: React + TypeScript + Vite
- **Hosting**: Cloudflare Pages
- **Location**: `/apps/web/`

### 後端（Backend）
- **Domain**: `api.example.com`
- **Tech Stack**: FastAPI + Python
- **Hosting**: AWS ECS Fargate (behind ALB)
- **Location**: `/apps/api/`

### 基礎設施（Infrastructure）
- **ECS Configuration**: `/infra/ecs/`
- **Docker Files**: `/docker/`

## 專案結構

```
registration-system/
├── apps/
│   ├── web/              # 前端專案（Vite + React）
│   └── api/              # 後端專案（FastAPI）
├── infra/
│   └── ecs/              # ECS task definitions & service configs
├── docker/
│   └── api.Dockerfile    # 後端 Docker image
├── .github/
│   └── workflows/
│       ├── deploy-web.yml    # 前端部署 workflow
│       └── deploy-api.yml    # 後端部署 workflow
└── README.md
```

## 開發指南

### 前端開發

```bash
cd apps/web
npm install
npm run dev
```

前端會在 `http://localhost:5173` 啟動

### 後端開發

```bash
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload
```

後端會在 `http://localhost:8000` 啟動

## 部署

### 前端部署（Cloudflare Pages）

1. 連接 GitHub repository 到 Cloudflare Pages
2. 設定構建配置：
   - **Build command**: `cd apps/web && npm ci && npm run build`
   - **Build output directory**: `apps/web/dist`
   - **Environment variables**:
     - `VITE_API_BASE_URL=https://api.example.com`

3. Push 到 `main` branch 會自動觸發部署

### 後端部署（AWS ECS Fargate）

後端透過 GitHub Actions 自動部署到 ECS：
1. Push 到 `main` branch
2. GitHub Actions 構建 Docker image
3. 推送到 ECR
4. 更新 ECS service

詳見 `.github/workflows/deploy-api.yml`

## 環境變數

### 前端（apps/web/.env.local）
```
VITE_API_BASE_URL=https://api.example.com
```

### 後端（apps/api/.env）
```
# 參考 apps/api/.env.example
```

## DNS 設定

- `app.example.com` → Cloudflare Pages
- `api.example.com` → AWS ALB (CNAME/ALIAS)

## 認證流程

使用 AWS Cognito + 公司 IdP（SAML/OIDC）整合

## License

Private

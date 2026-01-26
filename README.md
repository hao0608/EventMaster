# EventMaster MVP

EventMaster 是一個活動報名與驗票系統的 MVP (Minimum Viable Product)。
本專案為 **全端 Monorepo**，包含 FastAPI 後端與 React 前端，提供完整的活動建立、審核、報名、QR Code 票券與現場驗票流程。

## 🚀 快速開始 (Quick Start)

### 1. 後端 (FastAPI)
```bash
cd apps/api
poetry install
poetry run python seed_data.py
poetry run uvicorn main:app --reload
```

### 2. 前端 (React)
```bash
cd apps/web
npm install
npm run dev
```

開啟瀏覽器前往 `http://localhost:5173`，後端 API 於 `http://localhost:8000`。

---

## 🧪 測試帳號 (Test Accounts)

系統預設提供三種角色供測試 (密碼預設皆為 `password123`)：

| 角色 | Email | 功能權限 |
| :--- | :--- | :--- |
| **Member** (會員) | `member@company.com` | 瀏覽活動、報名、查看 QR Code |
| **Organizer** (主辦方) | `org@company.com` | 建立活動、**掃描驗票**、現場補登 (Walk-in) |
| **Admin** (管理員) | `admin@company.com` | 系統全權限、管理用戶角色 |

> 管理員可於「審核活動」頁面核准/駁回待審核活動；主辦方建立活動後預設為待審核狀態。

---

## 📚 文件索引 (Documentation)

詳細的設計文件請參考 `docs/` 目錄：

*   **[MVP 產品規格書 (MVP_SPEC.md)](docs/MVP_SPEC.md)**: 包含產品目標、User Stories、資料庫 Schema 與 API 定義。(後端開發請參考此份)
*   **[前端架構說明 (FRONTEND_ARCH.md)](docs/FRONTEND_ARCH.md)**: 包含前端目錄結構、技術堆疊與 API 服務層說明。
*   **[後端架構說明 (BACKEND_ARCHITECTURE.md)](docs/BACKEND_ARCHITECTURE.md)**: 包含後端分層與資料模型說明。
*   **[系統架構總覽 (ARCHITECTURE.md)](docs/ARCHITECTURE.md)**: 前後端整體架構概覽。

---

## 🛠️ 技術堆疊

*   **Framework**: React 18
*   **Language**: TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Routing**: React Router DOM v6
*   **State**: React Context API

---

## 📁 專案結構 (Project Structure)

```
eventmaster/
├── apps/
│   ├── web/                    # 前端專案 (React + TypeScript + Vite)
│   │   ├── components/         # 共用 UI 元件
│   │   │   ├── Navbar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/           # 全域狀態管理
│   │   │   └── AuthContext.tsx
│   │   ├── pages/              # 頁面視圖
│   │   │   ├── Login.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── EventDetail.tsx
│   │   │   ├── EditEvent.tsx
│   │   │   ├── MyTickets.tsx
│   │   │   ├── OrganizerVerify.tsx
│   │   │   ├── EventAttendees.tsx
│   │   │   ├── AdminCreateEvent.tsx
│   │   │   └── AdminUsers.tsx
│   │   ├── services/           # API 服務層
│   │   │   └── api.ts
│   │   ├── public/             # 靜態資源
│   │   ├── types.ts            # TypeScript 型別定義
│   │   ├── App.tsx             # 主應用程式與路由
│   │   ├── index.tsx           # 入口點
│   │   ├── vite.config.ts      # Vite 配置
│   │   └── package.json
│   └── api/                    # 後端專案 (FastAPI)
├── docs/                       # 專案文件
│   ├── MVP_SPEC.md            # MVP 產品規格書
│   └── FRONTEND_ARCH.md       # 前端架構說明
├── infra/                      # 基礎設施配置
│   └── ecs/                   # AWS ECS 配置 (預留)
├── docker/                     # Docker 配置 (預留)
├── .github/                    # GitHub Actions 工作流程
│   └── workflows/
├── package.json                # Monorepo 根目錄套件配置
├── CLOUDFLARE_DEPLOYMENT.md   # Cloudflare Pages 部署指南
└── README.md                   # 本文件
```

### 目錄說明

*   **`apps/web/`**: 前端應用程式主目錄，包含所有 React 元件、頁面與服務
*   **`docs/`**: 專案文件，包含產品規格與技術架構說明
*   **`apps/api/`**: 後端 API 目錄（FastAPI + SQLAlchemy）
*   **`infra/`**: 基礎設施配置
    *   `infra/terraform/`: Terraform IaC 配置
        *   `modules/`: 可重用的 Terraform 模組 (VPC, ECS, RDS, Cognito 等)
        *   `environments/dev/`: Dev 環境設定

---

## 🌐 Dev 環境部署 (AWS Deployment)

本專案使用 Terraform 部署至 AWS，架構包含：
- **前端**: Cloudflare Pages (自動部署)
- **後端**: AWS ECS Fargate + ALB
- **資料庫**: AWS RDS PostgreSQL
- **認證**: AWS Cognito User Pool

### 前置條件

1. 安裝 [Terraform](https://www.terraform.io/downloads) >= 1.0
2. 安裝 [AWS CLI](https://aws.amazon.com/cli/) 並設定認證
3. 安裝 [Docker](https://www.docker.com/) (用於建置後端映像檔)

### 部署步驟

#### 1. 初始化 Terraform

```bash
cd infra/terraform/environments/dev

# 複製並編輯設定檔
cp terraform.tfvars.example terraform.tfvars
# 編輯 terraform.tfvars 設定 AWS region 等參數

# 初始化 Terraform
terraform init

# 檢視部署計畫
terraform plan -out=tfplan

# 執行部署
terraform apply tfplan
```

#### 2. 建置並部署後端

```bash
# 取得 ECR 登入權杖
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com

# 建置 Docker 映像檔
cd apps/api
docker build -t eventmaster-api .

# 推送至 ECR
docker tag eventmaster-api:latest <ecr-repo-url>:latest
docker push <ecr-repo-url>:latest

# 強制 ECS 服務更新
aws ecs update-service --cluster eventmaster-cluster-dev --service eventmaster-api-dev --force-new-deployment
```

#### 3. 建立 Cognito 測試使用者

```bash
# 執行測試使用者建立腳本
./specs/002-dev-deployment-arch/scripts/create-test-users.sh
```

### Dev 環境測試帳號

部署完成後，可使用以下 Cognito 測試帳號：

| 角色 | Email | 密碼 | 權限 |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@eventmaster.test` | `AdminPass123!` | 系統全權限 |
| **Organizer** | `organizer@eventmaster.test` | `OrganizerPass123!` | 建立活動、驗票 |
| **Member** | `member@eventmaster.test` | `MemberPass123!` | 瀏覽活動、報名 |

### 取得部署資訊

```bash
cd infra/terraform/environments/dev

# 取得 API 端點
terraform output api_url

# 取得 Cognito 設定
terraform output cognito_user_pool_id
terraform output cognito_client_id
```

### 完整部署指南

詳細的部署步驟與除錯指引請參考：
- **[快速部署指南 (quickstart.md)](specs/002-dev-deployment-arch/quickstart.md)**
- **[Cognito 認證測試指南](specs/002-dev-deployment-arch/COGNITO_TESTING.md)**

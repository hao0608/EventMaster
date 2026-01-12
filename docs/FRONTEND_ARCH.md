# 前端架構說明

本文件說明 EventMaster 前端專案的技術架構、目錄結構與 Mock 服務邏輯。

## 1. 專案概覽

### 基本資訊
- **位置**: `/apps/web/`
- **Tech Stack**: React 18 + TypeScript + Vite
- **Hosting**: Cloudflare Pages
- **Domain**: `app.example.com`

### 專案結構

```text
apps/web/
├── components/      # 共用 UI 元件
│   ├── Navbar.tsx           # 導覽列 (含 RWD 與角色權限判斷)
│   └── ProtectedRoute.tsx   # 路由守衛 (處理登入檢核與角色導流)
├── contexts/        # 全域狀態管理
│   └── AuthContext.tsx      # 管理 User 登入狀態與 localStorage 持久化
├── pages/           # 頁面視圖 (Views)
│   ├── Login.tsx            # 登入頁 (Email/Password)
│   ├── Events.tsx           # 活動列表
│   ├── EventDetail.tsx      # 活動詳情 & 報名操作
│   ├── EditEvent.tsx        # 編輯活動頁面
│   ├── MyTickets.tsx        # 會員票券匣 (顯示 QR Code)
│   ├── OrganizerVerify.tsx  # 主辦方後台：驗票與現場補登 (Tabs 設計)
│   ├── EventAttendees.tsx   # 主辦方後台：報名名單列表
│   ├── AdminCreateEvent.tsx # 管理員：建立活動
│   └── AdminUsers.tsx       # 管理員：用戶權限管理
├── services/        # 服務層
│   └── mockApi.ts           # 模擬後端 CRUD 與延遲 (Production 時需替換)
├── public/          # 靜態資源
├── types.ts         # TypeScript 型別定義 (User, Event, Registration)
├── App.tsx          # 主應用程式元件與路由配置
├── index.tsx        # 應用程式入口點
├── index.html       # HTML 模板
├── vite.config.ts   # Vite 建構配置
├── tsconfig.json    # TypeScript 配置
├── package.json     # 專案相依套件
└── .env.example     # 環境變數範例
```

## 2. 核心邏輯說明

### 模擬 API (Mock Service)
為了在沒有後端的情況下進行 MVP 驗證，所有資料操作皆透過 `services/mockApi.ts` 進行。
*   資料儲存於記憶體變數 (`MOCK_USERS`, `MOCK_EVENTS`...)。
*   使用 `setTimeout` 模擬網路延遲 (`delay` function)。
*   **注意**：重新整理頁面時，除了登入狀態 (LocalStorage) 外，Mock Data 會重置。

### 權限控制 (RBAC)
權限控制主要由 `ProtectedRoute` 元件實作：
*   **未登入**：強制導向 `/` (Login)。
*   **已登入但權限不足**：
    *   若 Member 嘗試進入 Organizer 頁面 -> 顯示 Access Denied。
*   **實作位置**：`App.tsx` 中的路由定義。

### 票券與 QR Code
*   目前使用字串組合模擬 Token：`QR-{eventId}-{userId}-{random}`。
*   QR Code 圖片生成使用第三方 API：`api.qrserver.com`。

## 3. 開發與部署

### 本地開發

```bash
# 進入前端專案目錄
cd apps/web

# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev
```

開發伺服器會在 `http://localhost:5173` 啟動。

### 環境變數

在 `apps/web/` 目錄下建立 `.env.local` 檔案：

```bash
# API Base URL (Production)
VITE_API_BASE_URL=https://api.example.com
```

目前使用 Mock API，此環境變數為未來整合真實後端預留。

### 部署到 Cloudflare Pages

**自動部署流程**：
1. Push 到 `main` branch 觸發自動部署
2. Cloudflare Pages 自動構建並部署

**手動設定步驟**：
1. 連接 GitHub repository 到 Cloudflare Pages
2. 設定構建配置：
   - **Framework preset**: Vite
   - **Build command**: `cd apps/web && npm ci && npm run build`
   - **Build output directory**: `apps/web/dist`
   - **Root directory**: `/` (monorepo root)
3. 設定環境變數：
   - `VITE_API_BASE_URL=https://api.example.com`
4. 配置自訂網域：`app.example.com`

詳細部署說明請參考專案根目錄的 `CLOUDFLARE_DEPLOYMENT.md`。

## 4. 未來整合指南 (Backend Integration)

若要對接真實後端 (FastAPI/Node.js)，請依循以下步驟：

1.  **替換 API Layer**：
    *   保留 `services/` 資料夾結構。
    *   將 `mockApi.ts` 內容替換為 `axios` 或 `fetch` 呼叫。
    *   API Endpoint 需對應 `docs/MVP_SPEC.md` 定義的 REST 介面。

2.  **安全性增強**：
    *   在 `AuthContext` 中，登入成功後需將後端回傳的 `JWT Token` 存入 Storage。
    *   設定 Axios Interceptor，在每個 Request Header 加入 `Authorization: Bearer <token>`。

3.  **環境變數更新**：
    *   更新 `.env.local` 檔案中的 `VITE_API_BASE_URL` 為真實後端 URL。
    *   在 Cloudflare Pages 環境變數中同步更新此設定。

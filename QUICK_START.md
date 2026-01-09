# 快速開始 - 推送到 GitHub 並部署

## 1. 初始化 Git Repository

```bash
# 初始化 git
git init

# 加入所有文件
git add .

# 創建第一個 commit
git commit -m "Initial commit: Monorepo structure with frontend"
```

## 2. 推送到 GitHub

```bash
# 創建 GitHub repository（在 GitHub 網站上操作或使用 gh CLI）
# 方法 A: 使用 GitHub CLI（推薦）
gh repo create event-master --private --source=. --remote=origin --push

# 方法 B: 手動操作
# 1. 在 GitHub 上創建新的 private repository
# 2. 然後執行：
git remote add origin https://github.com/你的用戶名/event-master.git
git branch -M main
git push -u origin main
```

## 3. 部署到 Cloudflare Pages

詳細步驟請參考 [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)

**快速摘要**：

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Workers & Pages → Create application → Pages → Connect to Git
3. 選擇你的 GitHub repository
4. 設定構建配置：
   - Build command: `cd apps/web && npm ci && npm run build`
   - Build output directory: `apps/web/dist`
   - Environment variable: `VITE_API_BASE_URL=https://api.example.com`
5. Save and Deploy

## 4. 本地開發測試

```bash
# 安裝前端依賴
cd apps/web
npm install

# 啟動開發服務器
npm run dev
```

## 目錄結構一覽

```
event-master/
├── apps/
│   ├── web/                    # 前端（Vite + React + TypeScript）
│   │   ├── components/         # React 組件
│   │   ├── contexts/           # React Context
│   │   ├── pages/              # 頁面組件
│   │   ├── services/           # API 服務
│   │   ├── public/
│   │   │   └── _redirects      # Cloudflare Pages SPA fallback
│   │   ├── .env.example        # 環境變數範例
│   │   └── package.json
│   │
│   └── api/                    # 後端（預留給 FastAPI）
│       └── README.md
│
├── infra/ecs/                  # AWS ECS 配置（未來使用）
├── docker/                     # Docker 配置（未來使用）
├── .github/workflows/          # GitHub Actions（未來使用）
│
├── .gitignore
├── README.md                   # 主要說明文檔
├── CLOUDFLARE_DEPLOYMENT.md    # Cloudflare 部署指南
├── QUICK_START.md              # 本文件
└── package.json                # Monorepo 根配置
```

## 下一步

- [ ] 完成 Cloudflare Pages 部署
- [ ] 設定自訂 domain (`app.example.com`)
- [ ] 實作後端 FastAPI
- [ ] 設定 AWS ECS 部署
- [ ] 配置 CORS（後端允許前端 domain）
- [ ] 整合 AWS Cognito 認證

## 有用的指令

```bash
# 從根目錄啟動前端開發
npm run web:dev

# 從根目錄構建前端
npm run web:build

# 推送到 GitHub（會觸發 Cloudflare 自動部署）
git add .
git commit -m "Your commit message"
git push
```

## 需要協助？

參考以下文件：
- [README.md](./README.md) - 專案總覽
- [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) - 部署指南
- [apps/web/.env.example](./apps/web/.env.example) - 環境變數設定

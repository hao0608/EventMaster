# Cloudflare Pages 部署指南

## 前置準備

1. 將專案推送到 GitHub
2. 擁有 Cloudflare 帳號
3. 已將 domain 加入 Cloudflare DNS 管理

## 部署步驟

### 1. 連接 GitHub Repository

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 選擇 **Workers & Pages**
3. 點擊 **Create application**
4. 選擇 **Pages** > **Connect to Git**
5. 授權 Cloudflare 存取你的 GitHub 帳號
6. 選擇此 repository

### 2. 設定構建配置

在 Cloudflare Pages 設定頁面：

#### Build settings
- **Framework preset**: None（或選擇 Vite）
- **Build command**:
  ```bash
  cd apps/web && npm ci && npm run build
  ```
- **Build output directory**:
  ```
  apps/web/dist
  ```
- **Root directory**: `/`（保持根目錄）

#### Environment variables

點擊 **Add variable** 新增以下環境變數：

**Production（生產環境）**:
```
VITE_API_BASE_URL=https://api.example.com
```

**Preview（預覽環境）** (可選):
```
VITE_API_BASE_URL=https://api-staging.example.com
```

### 3. 部署

1. 點擊 **Save and Deploy**
2. Cloudflare Pages 會開始構建你的應用
3. 構建完成後，會得到一個 `*.pages.dev` 的臨時網址

### 4. 設定自訂 Domain

#### 4.1 新增自訂 Domain

1. 在 Cloudflare Pages 專案中，選擇 **Custom domains**
2. 點擊 **Set up a custom domain**
3. 輸入你的 domain：`app.example.com`
4. Cloudflare 會自動建立必要的 DNS 記錄

#### 4.2 驗證 DNS 設定

前往 **DNS** 管理頁面，確認有以下記錄：
```
Type: CNAME
Name: app
Content: <your-project>.pages.dev
Proxy: Enabled (橘色雲朵)
```

### 5. 自動部署設定

**Main branch（生產環境）**:
- 推送到 `main` branch 會自動觸發生產環境部署
- 自動部署到 `app.example.com`

**Preview branches**:
- 推送到其他 branch 會建立預覽環境
- 每個 PR 都會有獨立的預覽網址

## 部署後檢查清單

- [ ] 檢查 `app.example.com` 是否可以正常訪問
- [ ] 確認 API 請求指向正確的 `api.example.com`
- [ ] 測試登入功能
- [ ] 檢查 CORS 設定（後端需要允許 `https://app.example.com`）
- [ ] 測試路由（React Router）是否正常運作

## 常見問題

### Q: 404 錯誤（React Router 路由失效）

Cloudflare Pages 需要設定 SPA fallback。

**解決方案**：在專案根目錄創建 `public/_redirects` 文件：
```
/*    /index.html   200
```

### Q: 環境變數沒有生效

確認：
1. 環境變數名稱必須以 `VITE_` 開頭
2. 修改環境變數後需要重新部署
3. 在 Cloudflare Pages 設定中檢查變數是否正確設定

### Q: Build 失敗

常見原因：
1. `Build command` 路徑錯誤
2. `Build output directory` 路徑錯誤
3. Node.js 版本不符（可在環境變數設定 `NODE_VERSION=18`）

檢查 build log 找出具體錯誤。

## 回滾部署

1. 前往 Cloudflare Pages 專案
2. 選擇 **Deployments**
3. 找到之前成功的部署
4. 點擊 **...** > **Rollback to this deployment**

## 進階設定

### 啟用 Preview Deployments

在 **Settings** > **Builds & deployments** 中：
- 啟用 **Automatic branch deployments**
- 設定 **Production branch**: `main`
- Preview branches 會自動建立預覽環境

### 設定 Build 快取

Cloudflare Pages 預設會快取 `node_modules`，加速後續 build。

### 自訂 Headers

如需自訂 HTTP headers，在 `apps/web/public/_headers` 創建文件：
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

## 監控與 Analytics

在 Cloudflare Pages 專案中可以查看：
- 部署歷史
- 訪問量統計（需啟用 Web Analytics）
- 錯誤日誌

## 相關連結

- [Cloudflare Pages 官方文件](https://developers.cloudflare.com/pages/)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#cloudflare-pages)
- [Cloudflare DNS 設定](https://developers.cloudflare.com/dns/)

# MVP 規格書：活動報名與驗票系統（JWT + RBAC）

## 1. 一句話定位 (Elevator Pitch)

這是一個 **以 JWT 驗證與角色式存取控制 (RBAC) 為核心的活動報名系統**，讓主辦方能快速建立活動，使用者完成報名並取得 QR Code，並由現場工作人員即時驗票。系統專為 **小規模使用 (<200 人)** 設計，強調 **快速上線、低維運成本、清楚的權限分工**。

---

## 2. MVP 目標 (1 Sprint Scope)

讓以下流程在 Production 環境中 **完整跑通**：

> **主辦方建立活動 → 使用者報名 → 系統產生 QR Code → 現場驗票 Check-in**

並具備最小但正確的 **JWT-based Authentication + RBAC** 權限控管能力。

---

## 3. 使用者角色與 RBAC

### 角色定義

| 角色 | 說明 |
| :--- | :--- |
| **member** | 一般使用者，可報名活動、查看自己的報名與 QR |
| **organizer** | 主辦 / 櫃台人員，可查看報名名單並進行驗票 |
| **admin** | 系統管理者，可建立活動與指派角色 |

### 權限策略 (Policy)

*   **member**: `event:read`, `registration:create`, `registration:read_own`, `qr:issue`
*   **organizer**: `registration:read_all`, `qr:verify`
*   **admin**: `event:write`, `admin:assign_role` (包含 organizer 權限)

---

## 4. 功能範圍

### 必做 (MVP Core)

#### 認證 (Authentication)
*   使用 **Email / Password** 登入
*   後端驗證帳密後簽發 **JWT Access Token**
*   所有 API 以 `Authorization: Bearer <token>` 驗證

#### 活動 (Events)
*   活動列表 (可報名活動)
*   活動詳細頁
*   Admin 建立 / 編輯活動 (基本欄位)

#### 報名 (Registrations)
*   Member 報名活動
*   查看「我的報名紀錄」

#### QR Code
*   對已報名紀錄產生 QR Token
*   Token 為短效或一次性使用

#### 驗票 (Check-in)
*   Organizer 輸入或掃描 QR Code
*   系統驗證有效性並標記為 `checked_in`

---

## 5. 資料庫設計 (PostgreSQL Schema)

### `users`
*   `id` (UUID, PK)
*   `email` (unique)
*   `display_name`
*   `password_hash`
*   `created_at`

### `events`
*   `id` (UUID, PK)
*   `title`
*   `description`
*   `start_at`, `end_at`
*   `location`
*   `capacity`
*   `organizer_id` (FK -> users.id)

### `registrations`
*   `id` (UUID, PK)
*   `event_id` (FK)
*   `user_id` (FK)
*   `status` (`registered | checked_in | cancelled`)
*   `qr_token` (Optional, or computed)
*   `created_at`

---

## 6. API 介面 (RESTful)

### Auth
*   `POST /auth/login`
*   `GET /auth/me`

### Events
*   `GET /events`
*   `GET /events/{id}`
*   `POST /events` (Admin/Organizer only)
*   `PATCH /events/{id}` (Admin/Organizer only)

### Registrations
*   `POST /events/{id}/registrations` (Member)
*   `GET /me/registrations` (Member)
*   `GET /events/{id}/attendees` (Organizer/Admin)

### Check-in
*   `POST /verify` (Organizer only)
    *   Body: `{ "qr_code": "..." }`
*   `POST /walk-in` (Organizer only)

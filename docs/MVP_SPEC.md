# 📘 Product Requirements Document (PRD)

**Project:** EventMaster (活動報名與驗票系統)
**Version:** 1.0 (MVP)
**Status:** Implementation Phase
**Target Users:** 內部員工 / 活動參與者 / 主辦單位
**Expected Users:** < 200 (Concurrent)
**Primary Goal:** 在最短時間內，讓「活動建立 → 審核 → 報名 → QR → 現場驗票」完整跑通

---

## 1. 產品背景與問題定義（Problem Statement）

目前公司內部活動報名與現場驗票流程存在以下問題：
*   報名與名單分散（Excel / Email / 人工統計）。
*   現場無法快速確認是否已報名、是否重複進場。
*   無統一身分與權限控管（誰能看名單？誰能驗票？）。

**本系統要解決的核心問題：**
> 用一套簡單、可控、可維運的系統，完成「報名 → QR → 驗票 → 名單控管」的數位化閉環。

---

## 2. 產品目標（Goals & Non-Goals）

### 2.1 MVP 目標（Goals）
✅ 必須在 1 個 Sprint 內完成：
1.  **活動管理**：主辦方可提案活動，管理員審核後發布。
2.  **報名流程**：使用者可搜尋活動、登入並完成報名。
3.  **票券系統**：系統自動產生 **唯一 QR Code**。
4.  **現場營運**：現場人員可掃描 QR 完成驗票，或協助無票人員進行 Walk-in 補登。
5.  **權限控管**：基本 RBAC 生效（避免權限混亂）。

### 2.2 明確不做的事（Non-Goals）
🚫 MVP 階段不包含：
*   金流 / 線上付款整合。
*   社群軟體整合 (LINE Bot / Slack)。
*   複雜的權限後台 UI 編輯（Permission Table 直接寫死於程式碼）。
*   超大量併發處理（目標 <200 人即可）。

---

## 3. 使用者角色與權限（RBAC）

### 3.1 角色定義

| Role | 說明 |
| :--- | :--- |
| **User (Member)** | 一般使用者 / 員工。僅能瀏覽公開活動與報名。 |
| **Organizer** | 活動主辦方。可提案活動、查看自己活動的報名名單、進行驗票。 |
| **Admin** | 系統管理員。擁有全域權限，負責審核活動、管理用戶角色。 |

### 3.2 權限矩陣（MVP）

| 功能 | Member | Organizer | Admin |
| :--- | :---: | :---: | :---: |
| 瀏覽公開活動 | ✅ | ✅ | ✅ |
| 搜尋活動 | ✅ | ✅ | ✅ |
| 建立活動 | ❌ | ✅ (需審核) | ✅ (直接發布) |
| 審核活動 (Approve/Reject) | ❌ | ❌ | ✅ |
| 編輯/刪除活動 | ❌ | ✅ (限本人) | ✅ |
| 活動報名 | ✅ | ✅ | ✅ |
| 查看自己票券 (QR) | ✅ | ✅ | ✅ |
| 查看活動報名名單 | ❌ | ✅ (限本人) | ✅ |
| QR 掃描驗票 | ❌ | ✅ (限本人) | ✅ |
| 現場補登 (Walk-in) | ❌ | ✅ (限本人) | ✅ |
| 指派用戶角色 | ❌ | ❌ | ✅ |

---

## 4. 使用者流程（User Flow）

### 4.1 一般使用者（Member）
1.  登入系統 (Email/Password)。
2.  瀏覽或 **搜尋** 活動列表。
3.  點擊活動 → 進入詳情頁 → 點擊「立即報名」。
4.  系統產生 QR Code，存入「我的票券」。
5.  活動當天出示 QR Code 入場。

### 4.2 主辦方（Organizer）
1.  **建立活動**：填寫活動資訊 → 送出審核 (Status: `PENDING`)。
2.  **營運管理**：待活動 `PUBLISHED` 後，隨時查看報名人數與名單。
3.  **現場驗票**：
    *   **掃描模式**：開啟驗票鏡頭/輸入代碼 → 驗證 QR → 系統回傳結果 (成功/重複/無效)。
    *   **補登模式 (Walk-in)**：輸入 Email 與姓名 → 系統建立報名並直接簽到。

### 4.3 系統管理員（Admin）
1.  **活動審核**：查看 `PENDING` 的活動清單 → 點擊「核准」或「駁回」。
2.  **用戶管理**：調整用戶的角色權限 (如將 Member 升級為 Organizer)。

---

## 5. 核心功能需求（Functional Requirements）

### 5.1 認證與身分（Auth）
*   使用 **JWT-based Authentication**。
*   Access Token 建議儲存於 HTTP-only Cookie 或 Frontend Memory (MVP 暫存 localStorage)。

### 5.2 活動管理（Event）
*   **資料欄位**：
    *   `id` (UUID)
    *   `title`, `description`, `location`
    *   `start_at`, `end_at`
    *   `capacity` (人數上限)
    *   `organizer_id` (FK)
    *   `status` (`PENDING` | `PUBLISHED` | `REJECTED`) **(重要)**
*   **搜尋功能**：支援依標題、描述、地點進行前端過濾。

### 5.3 報名系統（Registration）
*   一人一活動只能報名一次。
*   活動額滿或結束後不可報名。
*   報名成功即建立 Registration Record，並生成 QR Token。

### 5.4 QR Code 與驗票
*   **Token 邏輯**：包含 `event_id`, `user_id`, `random_seed` (MVP) 或 Signed Payload (Prod)。
*   **驗票狀態機**：
    *   `REGISTERED` (初始狀態)
    *   `CHECKED_IN` (已驗票，不可重複進場)
    *   `CANCELLED` (已取消，視為無效票)

---

## 6. 非功能需求（Non-Functional Requirements）

### 6.1 效能
*   列表載入時間 < 1s。
*   QR 驗票 API 回應時間 < 500ms (確保現場通關順暢)。

### 6.2 安全
*   API 需驗證 JWT Token 有效性。
*   **Resource Ownership Check**：Organizer 只能驗證「自己主辦活動」的票券，不可跨活動驗票。

### 6.3 維運
*   Docker 化部署 (Frontend + Backend)。
*   Environment Variables 管理 API Endpoint 與 Secrets。

---

## 7. 技術規格（Technical Stack）

### Frontend (本 Repository)
*   **Framework**: React 18 + Vite
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **State**: Context API
*   **Routing**: React Router v6

### Backend (建議規格)
*   **Language**: Python 3.12+
*   **Framework**: FastAPI
*   **Database**: PostgreSQL
*   **ORM**: SQLAlchemy / SQLModel

---

## 8. API 介面規劃 (RESTful)

| Method | Endpoint | 說明 | 權限 |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| POST | `/auth/login` | 登入 | Public |
| GET | `/auth/me` | 取得當前用戶資訊 | Auth |
| **Events** | | | |
| GET | `/events` | 取得公開活動列表 (Filter by `PUBLISHED`) | Auth |
| GET | `/events/admin/all` | 取得所有活動 (含 `PENDING`) | Admin |
| GET | `/events/{id}` | 取得活動詳情 | Auth |
| POST | `/events` | 建立活動 | Org / Admin |
| PATCH | `/events/{id}` | 更新活動 (含審核 Status) | Owner / Admin |
| DELETE | `/events/{id}` | 刪除活動 | Owner / Admin |
| **Registrations** | | | |
| POST | `/events/{id}/registrations` | 報名活動 | Member |
| GET | `/me/registrations` | 取得我的票券 | Member |
| DELETE | `/registrations/{id}` | 取消報名 | Member |
| **Operations** | | | |
| POST | `/verify` | 驗票 (Check-in) | Owner / Admin |
| POST | `/walk-in` | 現場補登並簽到 | Owner / Admin |
| GET | `/events/{id}/attendees` | 取得報名名單 | Owner / Admin |

---

## 9. 驗收條件（Acceptance Criteria）

✅ MVP 完成定義（Definition of Done）：
*   [ ] 使用者可順利登入、搜尋並報名活動。
*   [ ] Organizer 建立活動後，Admin 可在審核頁面看到並核准。
*   [ ] 報名後，「我的票券」頁面能正確顯示 QR Code。
*   [ ] 驗票功能可正確辨識：有效票、重複票 (已入場)、無效票。
*   [ ] 現場補登 (Walk-in) 可成功將新用戶加入名單並標記為已簽到。

# 後端 API 測試報告

**測試日期**: 2026-01-22
**測試環境**: localhost:8002
**測試分支**: 001-event-approval-system
**測試人員**: Claude AI Assistant

---

## 測試摘要

| 類別 | 測試項目數 | 通過 | 失敗 | 通過率 |
|------|-----------|------|------|--------|
| 認證 (Auth) | 2 | 2 | 0 | 100% |
| 活動審核 (Event Approval) | 3 | 3 | 0 | 100% |
| 活動報名 (Registration) | 1 | 1 | 0 | 100% |
| 驗票功能 (Check-in) | 2 | 2 | 0 | 100% |
| **總計** | **8** | **8** | **0** | **100%** |

---

## 詳細測試結果

### 1. 認證功能 (Authentication)

#### 1.1 登入 - POST /auth/login

**測試目的**: 驗證使用者登入功能

| 測試案例 | 輸入 | 預期結果 | 實際結果 | 狀態 |
|----------|------|----------|----------|------|
| 管理員登入 | email: admin@company.com, password: password123 | 回傳 access_token 和 user 資料 | 成功取得 token | ✅ 通過 |
| 主辦方登入 | email: org@company.com, password: password123 | 回傳 access_token 和 user 資料 | 成功取得 token | ✅ 通過 |

**測試指令**:
```bash
curl -X POST http://localhost:8002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "password123"}'
```

**回應範例**:
```json
{
  "user": {
    "id": "u1",
    "email": "admin@company.com",
    "display_name": "Admin User",
    "role": "admin"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. 活動審核功能 (Event Approval)

#### 2.1 取得待審核活動 - GET /events/pending

**測試目的**: 驗證管理員可以取得所有待審核的活動列表

| 測試案例 | 權限 | 預期結果 | 實際結果 | 狀態 |
|----------|------|----------|----------|------|
| 管理員查詢 | admin | 回傳 status=pending 的活動列表 | 成功回傳待審核活動 | ✅ 通過 |

**測試指令**:
```bash
curl -X GET http://localhost:8002/events/pending \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**回應範例**:
```json
{
  "items": [
    {
      "id": "evt-pending-001",
      "title": "待審核活動",
      "status": "pending",
      "organizer_id": "u2",
      ...
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### 2.2 核准活動 - PATCH /events/{id}/approve

**測試目的**: 驗證管理員可以核准待審核的活動

| 測試案例 | 輸入 | 預期結果 | 實際結果 | 狀態 |
|----------|------|----------|----------|------|
| 核准待審核活動 | event_id: evt-pending-001 | status 變更為 published | 活動狀態成功變更 | ✅ 通過 |

**測試指令**:
```bash
curl -X PATCH http://localhost:8002/events/evt-pending-001/approve \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**回應範例**:
```json
{
  "id": "evt-pending-001",
  "title": "待審核活動",
  "status": "published",
  ...
}
```

#### 2.3 駁回活動 - PATCH /events/{id}/reject

**測試目的**: 驗證管理員可以駁回待審核的活動

| 測試案例 | 輸入 | 預期結果 | 實際結果 | 狀態 |
|----------|------|----------|----------|------|
| 駁回待審核活動 | event_id: evt-pending-002 | status 變更為 rejected | 活動狀態成功變更 | ✅ 通過 |

**測試指令**:
```bash
curl -X PATCH http://localhost:8002/events/evt-pending-002/reject \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

**回應範例**:
```json
{
  "id": "evt-pending-002",
  "title": "另一個待審核活動",
  "status": "rejected",
  ...
}
```

---

### 3. 活動報名功能 (Registration)

#### 3.1 報名活動 - POST /events/{id}/registrations

**測試目的**: 驗證會員可以報名已發布的活動

| 測試案例 | 輸入 | 預期結果 | 實際結果 | 狀態 |
|----------|------|----------|----------|------|
| 報名已發布活動 | event_id (已發布) | 建立報名記錄，回傳 QR Code | 成功報名並取得 QR Code | ✅ 通過 |

**測試指令**:
```bash
curl -X POST http://localhost:8002/events/evt-001/registrations \
  -H "Authorization: Bearer ${MEMBER_TOKEN}"
```

**回應範例**:
```json
{
  "id": "reg-001",
  "event_id": "evt-001",
  "user_id": "u3",
  "status": "registered",
  "qr_code": "QR-abc123xyz",
  "event_title": "技術分享會",
  "event_start_at": "2026-02-01T14:00:00"
}
```

---

### 4. 驗票功能 (Check-in)

#### 4.1 QR Code 驗票 - POST /verify

**測試目的**: 驗證主辦方可以透過 QR Code 完成驗票

| 測試案例 | 輸入 | 預期結果 | 實際結果 | 狀態 |
|----------|------|----------|----------|------|
| 有效 QR Code | qr_code: QR-abc123xyz | success=true, 報名狀態變更為 checked_in | 驗票成功 | ✅ 通過 |

**測試指令**:
```bash
curl -X POST http://localhost:8002/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ORGANIZER_TOKEN}" \
  -d '{"qr_code": "QR-abc123xyz"}'
```

**回應範例**:
```json
{
  "success": true,
  "message": "Check-in Successful!",
  "registration": {
    "id": "reg-001",
    "status": "checked_in",
    ...
  }
}
```

#### 4.2 現場報名 - POST /walk-in

**測試目的**: 驗證主辦方可以為現場參加者進行臨時報名

| 測試案例 | 輸入 | 預期結果 | 實際結果 | 狀態 |
|----------|------|----------|----------|------|
| 新用戶現場報名 | event_id, email, display_name | 建立新用戶並完成報到 | 現場報名成功 | ✅ 通過 |

**測試指令**:
```bash
curl -X POST http://localhost:8002/walk-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ORGANIZER_TOKEN}" \
  -d '{
    "event_id": "evt-001",
    "email": "walkin@example.com",
    "display_name": "現場參加者"
  }'
```

**回應範例**:
```json
{
  "success": true,
  "message": "Walk-in Registered & Checked In!",
  "registration": {
    "id": "reg-walkin-001",
    "status": "checked_in",
    ...
  }
}
```

---

## 錯誤處理測試

### 權限控制測試

| 測試案例 | 操作 | 使用者角色 | 預期結果 | 實際結果 | 狀態 |
|----------|------|-----------|----------|----------|------|
| 未授權存取審核端點 | GET /events/pending | member | 403 Forbidden | 403 | ✅ 通過 |
| 非管理員核准活動 | PATCH /events/{id}/approve | organizer | 403 Forbidden | 403 | ✅ 通過 |
| 驗票權限檢查 | POST /verify | member | 403 Forbidden | 403 | ✅ 通過 |

### 業務邏輯測試

| 測試案例 | 操作 | 預期結果 | 實際結果 | 狀態 |
|----------|------|----------|----------|------|
| 報名未發布活動 | POST /events/{pending-id}/registrations | 400 Bad Request | 400 | ✅ 通過 |
| 核准非待審核活動 | PATCH /events/{published-id}/approve | 400 Bad Request | 400 | ✅ 通過 |
| 重複驗票 | POST /verify (已使用的 QR Code) | success=false, "已報到" | 正確拒絕 | ✅ 通過 |

---

## 測試環境設定

### 測試帳號

| 角色 | Email | 密碼 | 用途 |
|------|-------|------|------|
| 管理員 | admin@company.com | password123 | 測試審核功能 |
| 主辦方 | org@company.com | password123 | 測試驗票功能 |
| 會員 | member@company.com | password123 | 測試報名功能 |

### 測試資料

測試資料透過 `seed_data.py` 腳本建立：
- 3 個測試用戶（各角色一人）
- 多個不同狀態的活動（pending, published, rejected）
- 預設的報名記錄

---

## 已知問題與修復

### 已修復問題

1. **路由順序問題** (`apps/api/src/routes/events.py`)
   - 問題：`/events/pending` 被 `/events/{event_id}` 攔截
   - 修復：將 `/pending` 路由移到 `/{event_id}` 之前

2. **FileHandler 初始化錯誤** (`apps/api/src/core/logging.py`)
   - 問題：`FileHandler` 不接受 `level` 參數
   - 修復：使用 `setLevel()` 方法設定日誌等級

3. **Enum 值存取錯誤** (`apps/api/src/domain/event_approval.py`)
   - 問題：`event.status.value` 在某些情況下會報錯
   - 修復：加入 `hasattr` 檢查處理 enum 和字串兩種情況

---

## 結論

所有核心 API 端點均已通過測試，Event Approval System 的後端功能運作正常。主要功能包括：

1. ✅ 使用者認證與授權
2. ✅ 活動審核流程（待審核 → 核准/駁回）
3. ✅ 活動報名與 QR Code 生成
4. ✅ QR Code 驗票
5. ✅ 現場報名功能
6. ✅ 角色權限控制 (RBAC)

建議後續工作：
- 建立自動化測試套件 (pytest)
- 增加邊界條件測試
- 壓力測試與效能評估

---

**報告完成時間**: 2026-01-22

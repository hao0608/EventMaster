# EventMaster - 3天MVP實施計劃

**文件版本**：1.0

**建立日期**：2026-01-20

**核心流程**：活動提案 → 管理員審核 → 用戶報名 → QR Code 生成 → 現場驗票

---

## 📋 目錄

1. [專案現狀分析](#專案現狀分析)
2. [MVP 目標定義](#mvp-目標定義)
3. [3天開發計劃](#3天開發計劃)
4. [技術實作細節](#技術實作細節)
5. [開發環境設置](#開發環境設置)
6. [驗收標準](#驗收標準)
7. [風險與應對](#風險與應對)

---

## 專案現狀分析

### ✅ 已完成部分

**前端 (React + TypeScript + Vite)**：
- 完整的頁面組件架構
- 所有核心頁面已建立：
  - `Login.tsx` - 登入頁面
  - `Events.tsx` - 活動列表
  - `EventDetail.tsx` - 活動詳情與報名
  - `MyTickets.tsx` - 我的票券（QR Code）
  - `AdminEventApprovals.tsx` - 活動審核（重要！）
  - `AdminCreateEvent.tsx` - 建立活動
  - `OrganizerVerify.tsx` - 驗票頁面
  - `EventAttendees.tsx` - 參加者名單
  - `AdminUsers.tsx` - 用戶管理
- React Router 路由配置
- AuthContext 認證狀態管理
- 前端可成功 build（已驗證）

**後端 (FastAPI + SQLAlchemy)**：
- FastAPI 框架已搭建
- 基礎路由模組：
  - `auth.py` - 認證相關
  - `events.py` - 活動管理
  - `registrations.py` - 報名管理
  - `checkin.py` - 驗票功能
  - `users.py` - 用戶管理
- SQLAlchemy ORM 模型：
  - User (含角色：Member/Organizer/Admin)
  - Event
  - Registration
- JWT 認證機制
- CORS 中間件配置
- Docker 配置文件
- seed_data.py 測試資料腳本

### ❌ 關鍵缺失

1. **後端 Event 模型缺少 `status` 欄位**
   - 前端審核頁面已完成，但後端不支援活動狀態
   - 需要的狀態：`PENDING`（待審核）、`PUBLISHED`（已發布）、`REJECTED`（已駁回）

2. **活動審核 API 未實現**
   - 缺少 `GET /events/pending` - 取得待審核活動列表
   - 缺少 `PATCH /events/{id}/approve` - 核准活動
   - 缺少 `PATCH /events/{id}/reject` - 駁回活動

3. **前端仍使用 Mock API**
   - 所有 API 調用都是模擬的
   - 需要建立真實的 API service 層
   - 需要處理真實的錯誤與 loading 狀態

4. **權限控制需強化**
   - 一般用戶不應看到 PENDING 狀態的活動
   - Organizer 建立的活動應預設為 PENDING
   - Admin 建立的活動可選擇直接 PUBLISHED

---

## MVP 目標定義

### 🎯 核心目標

**在 3 個工作天內，讓「活動建立 → 審核 → 報名 → QR → 現場驗票」完整跑通**

### 📊 驗收標準（Definition of Done）

- [ ] **活動審核流程**
  - Organizer 可建立活動（狀態自動為 PENDING）
  - Admin 可在「活動審核」頁面看到待審核的活動
  - Admin 可核准或駁回活動
  - 被核准的活動才會出現在公開活動列表

- [ ] **報名與 QR Code**
  - Member 可瀏覽並搜尋已發布（PUBLISHED）的活動
  - Member 可點擊「立即報名」完成報名
  - 報名後系統自動生成唯一的 QR Code
  - 「我的票券」頁面正確顯示 QR Code 圖片

- [ ] **驗票功能**
  - Organizer 可進入「驗票頁面」
  - 輸入或掃描 QR Code 後，系統回傳驗票結果
  - 正確辨識：有效票、重複票（已入場）、無效票
  - 防止重複入場

- [ ] **Walk-in 補登**
  - Organizer 可在現場為無票人員補登
  - 輸入 Email 與姓名後，系統建立報名並直接標記為已簽到

- [ ] **權限控制**
  - Member 只能看到 PUBLISHED 活動
  - Organizer 只能驗證自己主辦活動的票券
  - Admin 擁有全域權限

- [ ] **系統穩定性**
  - 沒有明顯的 bug
  - 錯誤訊息清楚易懂
  - Loading 狀態提示用戶

### 🚫 明確不做的事（V1 階段）

- ❌ 金流與線上付款
- ❌ Email 通知
- ❌ 社群軟體整合（LINE Bot / Slack）
- ❌ 複雜的權限編輯 UI
- ❌ 多語系支援
- ❌ 行動裝置相機掃描（QR Code 用手動輸入即可）
- ❌ 活動圖片上傳
- ❌ 報名表單自訂欄位

---

## 3天開發計劃

### 📅 Day 1：後端核心功能完善

**目標**：實現活動審核機制，讓後端完整支援 PENDING/PUBLISHED/REJECTED 狀態

#### ⏰ 上午任務（4小時）

**Task 1.1：Event 模型添加 status 欄位**
```python
# 檔案：apps/api/src/models/event.py
# 新增：
from enum import Enum as PyEnum

class EventStatus(str, PyEnum):
    PENDING = "PENDING"
    PUBLISHED = "PUBLISHED"
    REJECTED = "REJECTED"

class Event(Base):
    ...
    status = Column(String(20), default=EventStatus.PENDING, nullable=False, index=True)
```

**Task 1.2：建立資料庫遷移**
- 選項 A：使用 Alembic（推薦，如已配置）
- 選項 B：手動 SQL 遷移（快速但不建議長期使用）
- 選項 C：重新初始化 SQLite（開發階段可接受）

```bash
# 選項 C（最快）
cd apps/api
rm -f eventmaster.db  # 刪除舊資料庫
python seed_data.py   # 重新建立，帶 status 欄位
```

**Task 1.3：更新 seed_data.py**
- 建立不同狀態的測試活動：
  - 2個 PENDING 活動（供測試審核）
  - 5個 PUBLISHED 活動（供測試報名）
  - 1個 REJECTED 活動（供測試權限）

**Task 1.4：更新 Pydantic Schemas**
```python
# 檔案：apps/api/src/schemas/event.py
from ..models.event import EventStatus

class EventResponse(BaseModel):
    ...
    status: EventStatus  # 新增

class EventUpdate(BaseModel):
    ...
    status: Optional[EventStatus] = None  # 新增
```

#### ⏰ 下午任務（4小時）

**Task 1.5：修改現有 API 端點**

```python
# 檔案：apps/api/src/routes/events.py

# 修改：POST /events
# Organizer 建立的活動預設 PENDING
def create_event(...):
    event = Event(
        ...
        status=EventStatus.PUBLISHED if current_user.role == UserRole.ADMIN
               else EventStatus.PENDING
    )

# 修改：GET /events
# 一般用戶只看到 PUBLISHED 活動
def get_events(...):
    if current_user is None or current_user.role == UserRole.MEMBER:
        query = query.filter(Event.status == EventStatus.PUBLISHED)
    # Admin 和 Organizer 看到自己的所有活動
```

**Task 1.6：新增審核專用 API**

```python
# 新增：GET /events/pending
@router.get("/pending", response_model=EventListResponse)
def get_pending_events(
    current_user: User = Depends(require_admin),  # 僅 Admin
    db: Session = Depends(get_db)
):
    """取得所有待審核活動"""
    events = db.query(Event).filter(
        Event.status == EventStatus.PENDING
    ).order_by(Event.start_at.desc()).all()

    return EventListResponse(items=events, total=len(events))

# 新增：PATCH /events/{id}/approve
@router.patch("/{event_id}/approve", response_model=EventResponse)
def approve_event(
    event_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """核准活動"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status != EventStatus.PENDING:
        raise HTTPException(status_code=400, detail="Event is not pending")

    event.status = EventStatus.PUBLISHED
    db.commit()
    db.refresh(event)

    logger.info(f"Event {event_id} approved by {current_user.id}")
    return EventResponse.model_validate(event)

# 新增：PATCH /events/{id}/reject
@router.patch("/{event_id}/reject", response_model=EventResponse)
def reject_event(
    event_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """駁回活動"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status != EventStatus.PENDING:
        raise HTTPException(status_code=400, detail="Event is not pending")

    event.status = EventStatus.REJECTED
    db.commit()
    db.refresh(event)

    logger.info(f"Event {event_id} rejected by {current_user.id}")
    return EventResponse.model_validate(event)
```

**Task 1.7：測試所有 API**
```bash
# 啟動後端
uvicorn main:app --reload

# 測試登入
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com", "password":"password123"}'

# 測試取得待審核活動（需要 Admin token）
curl http://localhost:8000/events/pending \
  -H "Authorization: Bearer {admin_token}"

# 測試核准活動
curl -X PATCH http://localhost:8000/events/{event_id}/approve \
  -H "Authorization: Bearer {admin_token}"

# 測試一般用戶只看到 PUBLISHED 活動
curl http://localhost:8000/events
```

#### ✅ Day 1 完成標準
- 後端完整支援活動審核流程
- API 文檔（/docs）正確顯示新端點
- 使用測試帳號可以成功測試審核流程
- 權限控制正確（Member 看不到 PENDING 活動）

---

### 📅 Day 2：前後端整合與報名流程

**目標**：前端連接真實後端 API，完成「審核 → 報名 → QR」流程

#### ⏰ 上午任務（4小時）

**Task 2.1：建立真實 API Service**

```typescript
// 新檔案：apps/web/services/api.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 自動添加 JWT token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 錯誤處理
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Events
  async getEvents(limit = 20, offset = 0) {
    const response = await this.client.get('/events', { params: { limit, offset } });
    return response.data;
  }

  async getPendingEvents() {
    const response = await this.client.get('/events/pending');
    return response.data;
  }

  async getEvent(eventId: string) {
    const response = await this.client.get(`/events/${eventId}`);
    return response.data;
  }

  async createEvent(eventData: any) {
    const response = await this.client.post('/events', eventData);
    return response.data;
  }

  async approveEvent(eventId: string) {
    const response = await this.client.patch(`/events/${eventId}/approve`);
    return response.data;
  }

  async rejectEvent(eventId: string) {
    const response = await this.client.patch(`/events/${eventId}/reject`);
    return response.data;
  }

  // Registrations
  async registerForEvent(eventId: string) {
    const response = await this.client.post(`/events/${eventId}/registrations`);
    return response.data;
  }

  async getMyRegistrations() {
    const response = await this.client.get('/me/registrations');
    return response.data;
  }

  // Checkin
  async verifyTicket(qrCode: string) {
    const response = await this.client.post('/verify', { qr_code: qrCode });
    return response.data;
  }

  async walkInRegistration(eventId: string, email: string, displayName: string) {
    const response = await this.client.post('/walk-in', {
      event_id: eventId,
      email,
      display_name: displayName,
    });
    return response.data;
  }
}

export const api = new ApiService();
```

**Task 2.2：配置環境變數**

```bash
# apps/web/.env.local
VITE_API_BASE_URL=http://localhost:8000
```

**Task 2.3：更新前端頁面使用真實 API**

```typescript
// apps/web/pages/AdminEventApprovals.tsx
import { api } from '../services/api';  // 替換 mockApi

const loadEvents = async () => {
  try {
    setLoading(true);
    const data = await api.getPendingEvents();
    setPendingEvents(data.items);  // 注意：後端回傳 { items: [...], total: N }
  } catch (error) {
    console.error('Failed to load events:', error);
    setError('載入活動失敗');
  } finally {
    setLoading(false);
  }
};

const handleApprove = async (eventId: string) => {
  try {
    await api.approveEvent(eventId);
    // 樂觀更新 UI
    setPendingEvents(prev => prev.filter(e => e.id !== eventId));
    alert('活動已核准！');
  } catch (error) {
    alert('核准失敗，請稍後再試');
  }
};
```

**Task 2.4：測試登入與認證**
- 使用測試帳號登入
- 確認 JWT token 正確儲存在 localStorage
- 確認後續 API 請求帶上 Authorization header
- 測試 token 過期後自動跳轉登入頁

**Task 2.5：處理 CORS 問題**
```python
# apps/api/main.py - 確認 CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite 預設 port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### ⏰ 下午任務（4小時）

**Task 2.6：整合活動列表頁面**
```typescript
// apps/web/pages/Events.tsx
const [events, setEvents] = useState<Event[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  api.getEvents()
    .then(data => setEvents(data.items))
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
}, []);
```

**Task 2.7：整合報名功能**
```typescript
// apps/web/pages/EventDetail.tsx
const handleRegister = async () => {
  if (!confirm('確定要報名此活動嗎？')) return;

  try {
    setRegistering(true);
    const registration = await api.registerForEvent(eventId);
    alert(`報名成功！您的 QR Code 已生成。`);
    navigate('/my-tickets');
  } catch (error: any) {
    if (error.response?.status === 409) {
      alert('您已報名過此活動');
    } else if (error.response?.status === 400) {
      alert(error.response.data.detail || '報名失敗');
    } else {
      alert('報名失敗，請稍後再試');
    }
  } finally {
    setRegistering(false);
  }
};
```

**Task 2.8：整合「我的票券」頁面**
```typescript
// apps/web/pages/MyTickets.tsx
import QRCode from 'qrcode.react';  // 需安裝：npm install qrcode.react

const [tickets, setTickets] = useState<Registration[]>([]);

useEffect(() => {
  api.getMyRegistrations()
    .then(data => setTickets(data))
    .catch(err => console.error(err));
}, []);

// 顯示 QR Code
{tickets.map(ticket => (
  <div key={ticket.id} className="ticket-card">
    <h3>{ticket.event_title}</h3>
    <QRCode value={ticket.qr_code} size={200} />
    <p>狀態: {ticket.status === 'REGISTERED' ? '未簽到' : '已簽到'}</p>
  </div>
))}
```

**Task 2.9：測試完整報名流程**
1. Admin 登入 → 前往「活動審核」→ 核准一個 PENDING 活動
2. 登出 → 用 Member 帳號登入
3. 在活動列表看到剛才核准的活動
4. 點擊活動 → 報名
5. 前往「我的票券」→ 確認看到 QR Code

**Task 2.10：錯誤處理與 UI 優化**
- 添加 loading spinner
- 錯誤訊息顯示（toast 或 alert）
- 成功訊息提示
- 按鈕 disabled 狀態

#### ✅ Day 2 完成標準
- 前端完全不再使用 Mock API
- 完整的「審核 → 報名 → QR」流程可運行
- 錯誤處理清楚，用戶體驗良好
- 權限控制正確（Member 看不到審核頁面）

---

### 📅 Day 3：驗票功能與完整測試

**目標**：完成驗票與 Walk-in 功能，進行端到端測試

#### ⏰ 上午任務（4小時）

**Task 3.1：整合驗票頁面**
```typescript
// apps/web/pages/OrganizerVerify.tsx
const [qrCode, setQrCode] = useState('');
const [result, setResult] = useState<any>(null);
const [verifying, setVerifying] = useState(false);

const handleVerify = async () => {
  if (!qrCode.trim()) {
    alert('請輸入 QR Code');
    return;
  }

  try {
    setVerifying(true);
    setResult(null);
    const data = await api.verifyTicket(qrCode);
    setResult({
      success: true,
      message: '驗票成功！',
      user: data.user_display_name,
      event: data.event_title,
    });
  } catch (error: any) {
    if (error.response?.status === 400) {
      setResult({
        success: false,
        message: error.response.data.detail,  // 如：「此票已使用」「無效的 QR Code」
      });
    } else {
      setResult({
        success: false,
        message: '驗票失敗，請稍後再試',
      });
    }
  } finally {
    setVerifying(false);
  }
};

// UI：顯示驗票結果
{result && (
  <div className={result.success ? 'success-box' : 'error-box'}>
    <h2>{result.success ? '✅ 驗票成功' : '❌ 驗票失敗'}</h2>
    <p>{result.message}</p>
    {result.success && (
      <>
        <p>參加者：{result.user}</p>
        <p>活動：{result.event}</p>
      </>
    )}
  </div>
)}
```

**Task 3.2：整合 Walk-in 補登**
```typescript
// apps/web/pages/OrganizerVerify.tsx（同一頁面，分兩個 Tab）
const [walkInEmail, setWalkInEmail] = useState('');
const [walkInName, setWalkInName] = useState('');

const handleWalkIn = async () => {
  if (!walkInEmail || !walkInName) {
    alert('請填寫 Email 與姓名');
    return;
  }

  try {
    const data = await api.walkInRegistration(eventId, walkInEmail, walkInName);
    alert(`補登成功！${walkInName} 已完成簽到。`);
    // 清空表單
    setWalkInEmail('');
    setWalkInName('');
  } catch (error: any) {
    alert(error.response?.data?.detail || '補登失敗');
  }
};
```

**Task 3.3：測試驗票功能**
- 用 Member 帳號報名活動，取得 QR Code
- 複製 QR Code 字串
- 用 Organizer 帳號登入，前往驗票頁面
- 貼上 QR Code，點擊驗票
- 確認顯示「驗票成功」
- 再次貼上同一個 QR Code
- 確認顯示「此票已使用」或「重複入場」

**Task 3.4：測試 Walk-in 補登**
- 用 Organizer 帳號進入驗票頁面
- 切換到「Walk-in 補登」Tab
- 輸入一個不存在的 Email 與姓名
- 點擊「立即補登」
- 確認系統建立報名並直接標記為 CHECKED_IN
- 前往「參加者名單」頁面，確認該用戶出現在列表中

#### ⏰ 下午任務（4小時）

**Task 3.5：端到端完整測試**

**測試場景 1：Organizer 提案活動 → Admin 審核**
1. 用 `org@company.com` 登入
2. 建立新活動（標題、時間、地點、容量等）
3. 送出後確認狀態為「待審核」
4. 登出，用 `admin@company.com` 登入
5. 前往「活動審核」頁面
6. 確認看到剛才建立的活動
7. 點擊「核准」→ 確認活動消失（進入 PUBLISHED 狀態）

**測試場景 2：Member 報名活動 → 取得 QR Code**
1. 用 `member@company.com` 登入
2. 在活動列表看到已核准的活動
3. 點擊活動進入詳情頁
4. 點擊「立即報名」
5. 確認報名成功
6. 前往「我的票券」
7. 確認看到 QR Code 圖片

**測試場景 3：現場驗票與補登**
1. 複製 Member 的 QR Code 字串
2. 登出，用 Organizer 帳號登入
3. 前往「驗票」頁面
4. 貼上 QR Code，點擊驗票
5. 確認顯示「驗票成功」及參加者資訊
6. 再次驗票 → 確認顯示「已簽到，禁止重複入場」
7. 切換到「Walk-in」
8. 輸入新用戶的 Email 與姓名
9. 點擊「立即補登」
10. 前往「參加者名單」→ 確認該用戶已在列表中

**Task 3.6：邊界情況測試**

| 測試項目 | 預期結果 |
|---------|---------|
| 重複報名同一活動 | 顯示「您已報名過此活動」 |
| 報名已額滿的活動 | 顯示「活動已額滿」 |
| 驗證無效的 QR Code | 顯示「無效的 QR Code」 |
| 驗證已簽到的票券 | 顯示「此票已使用」 |
| Member 嘗試訪問審核頁面 | 重定向或顯示無權限 |
| Organizer 嘗試驗證其他人活動的票 | 顯示「無權限驗證此票券」 |
| 未登入訪問需認證的頁面 | 重定向至登入頁 |

**Task 3.7：UI/UX 優化**
- 所有 API 請求顯示 loading 狀態
- 成功訊息使用綠色提示
- 錯誤訊息使用紅色提示
- 按鈕在處理中時 disabled
- 表單驗證（必填欄位、Email 格式等）
- 空狀態處理（沒有活動時顯示提示）

**Task 3.8：文件更新**
```markdown
# README.md - 更新使用說明

## 本地開發

### 後端啟動
cd apps/api
source venv/bin/activate
python seed_data.py  # 初始化資料庫
uvicorn main:app --reload

### 前端啟動
cd apps/web
npm install
npm run dev

## 測試帳號
- Admin: admin@company.com / password123
- Organizer: org@company.com / password123
- Member: member@company.com / password123

## 測試流程
1. Organizer 建立活動
2. Admin 審核活動
3. Member 報名活動
4. Organizer 驗票
```

**Task 3.9：代碼檢查清單**
- [ ] 所有 console.log 已移除或改為 logger
- [ ] 沒有明顯的錯誤或警告
- [ ] TypeScript 編譯無錯誤
- [ ] ESLint 無嚴重問題
- [ ] 敏感資訊（如測試密碼）已從代碼註釋中移除

**Task 3.10：部署準備（選做）**
- 建立 production build
- 測試 production build 是否正常運作
- 準備環境變數說明文件
- 準備 Docker Compose 配置（如需要）

#### ✅ Day 3 完成標準
- 所有核心功能可正常運作
- 經過完整的端到端測試
- 關鍵流程無阻礙
- 錯誤處理完善
- 可進行系統演示

---

## 技術實作細節

### 後端技術要點

#### 1. Event Status 狀態機

```
[建立活動]
    ↓
  PENDING ──────┐
    ↓           │
    ├─[核准]→ PUBLISHED
    │
    └─[駁回]→ REJECTED
```

#### 2. 權限控制邏輯

```python
# apps/api/src/core/deps.py

def require_admin(current_user: User = Depends(get_current_user)):
    """要求 Admin 權限"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def require_organizer_or_admin(current_user: User = Depends(get_current_user)):
    """要求 Organizer 或 Admin 權限"""
    if current_user.role not in [UserRole.ORGANIZER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Organizer or Admin access required")
    return current_user

def check_event_ownership(event: Event, user: User):
    """檢查活動擁有權"""
    if user.role == UserRole.ADMIN:
        return True
    return event.organizer_id == user.id
```

#### 3. QR Code 生成策略

```python
# apps/api/src/models/registration.py
import uuid

def generate_qr_token():
    """生成唯一的 QR Code token"""
    return str(uuid.uuid4())

# 建立報名時
registration = Registration(
    id=str(uuid.uuid4()),
    event_id=event_id,
    user_id=user_id,
    qr_code=generate_qr_token(),  # 唯一驗證碼
    status=RegistrationStatus.REGISTERED
)
```

#### 4. 驗票邏輯

```python
# apps/api/src/routes/checkin.py

@router.post("/verify")
def verify_ticket(
    qr_code: str,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db)
):
    # 1. 查找報名記錄
    registration = db.query(Registration).filter(
        Registration.qr_code == qr_code
    ).first()

    if not registration:
        raise HTTPException(status_code=400, detail="無效的 QR Code")

    # 2. 檢查活動擁有權
    event = registration.event
    if not check_event_ownership(event, current_user):
        raise HTTPException(status_code=403, detail="無權驗證此活動的票券")

    # 3. 檢查狀態
    if registration.status == RegistrationStatus.CHECKED_IN:
        raise HTTPException(status_code=400, detail="此票已使用，禁止重複入場")

    if registration.status == RegistrationStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="此報名已取消")

    # 4. 更新狀態為已簽到
    registration.status = RegistrationStatus.CHECKED_IN
    db.commit()

    return {
        "success": True,
        "message": "驗票成功",
        "user_display_name": registration.user.display_name,
        "event_title": event.title
    }
```

### 前端技術要點

#### 1. API 錯誤處理

```typescript
// apps/web/services/api.ts

// 統一錯誤處理
this.client.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: Token 過期或無效 → 跳轉登入
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }

    // 403: 權限不足
    if (error.response?.status === 403) {
      alert('您沒有權限執行此操作');
    }

    // 500: 伺服器錯誤
    if (error.response?.status >= 500) {
      alert('伺服器錯誤，請稍後再試');
    }

    return Promise.reject(error);
  }
);
```

#### 2. QR Code 顯示

```bash
# 安裝依賴
npm install qrcode.react
npm install --save-dev @types/qrcode.react
```

```typescript
// apps/web/pages/MyTickets.tsx
import QRCode from 'qrcode.react';

<QRCode
  value={ticket.qr_code}  // QR Code 內容（UUID 字串）
  size={200}              // 圖片尺寸
  level="H"               // 錯誤修正等級
  includeMargin={true}    // 包含邊距
/>
```

#### 3. Protected Route 權限檢查

```typescript
// apps/web/components/ProtectedRoute.tsx
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <div>403 - Forbidden</div>;
  }

  return <>{children}</>;
};

// 使用
<Route
  path="/admin/approvals"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminEventApprovals />
    </ProtectedRoute>
  }
/>
```

---

## 開發環境設置

### 系統需求

- **作業系統**：Linux / macOS / Windows (with WSL)
- **Python**：3.11+
- **Node.js**：18+
- **資料庫**：SQLite（開發）/ PostgreSQL（生產）

### 初始設置步驟

#### 1. Clone 專案
```bash
cd /home/hpliu/develop/eventmaster
git status  # 確認目前在 main 分支
```

#### 2. 後端設置
```bash
cd apps/api

# 建立虛擬環境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt

# 配置環境變數
cp .env.example .env

# 編輯 .env（重要！）
# 修改 SECRET_KEY 為隨機字串：
# SECRET_KEY=your-secret-key-here-change-this-in-production

# 初始化資料庫
python seed_data.py

# 啟動後端
uvicorn main:app --reload --port 8000

# 測試（新終端）
curl http://localhost:8000/
curl http://localhost:8000/docs  # 開啟 API 文檔
```

#### 3. 前端設置
```bash
cd apps/web

# 安裝依賴
npm install

# 配置環境變數
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

# 啟動前端
npm run dev  # http://localhost:5173
```

#### 4. 測試登入
- 打開 http://localhost:5173
- 使用測試帳號登入：
  - Admin: `admin@company.com` / `password123`
  - Organizer: `org@company.com` / `password123`
  - Member: `member@company.com` / `password123`

### 常用指令

```bash
# 重置資料庫（開發時）
cd apps/api
rm -f eventmaster.db
python seed_data.py

# 查看後端 log
cd apps/api
uvicorn main:app --reload --log-level debug

# 前端 build 測試
cd apps/web
npm run build
npm run preview

# 檢查代碼品質
cd apps/web
npm run lint

cd apps/api
pip install flake8
flake8 src/
```

---

## 驗收標準

### 功能驗收清單

#### 1. 認證與權限
- [ ] 可使用測試帳號成功登入
- [ ] JWT Token 正確儲存與傳遞
- [ ] Token 過期後自動跳轉登入頁
- [ ] 不同角色看到不同的導航選單

#### 2. 活動審核流程
- [ ] Organizer 建立活動時預設 PENDING 狀態
- [ ] Admin 建立活動時預設 PUBLISHED 狀態
- [ ] Admin 可在「活動審核」頁面看到所有 PENDING 活動
- [ ] Admin 可核准活動（PENDING → PUBLISHED）
- [ ] Admin 可駁回活動（PENDING → REJECTED）
- [ ] 一般用戶無法看到 PENDING 或 REJECTED 活動

#### 3. 報名流程
- [ ] Member 可瀏覽 PUBLISHED 活動
- [ ] 可點擊「立即報名」完成報名
- [ ] 報名成功後自動生成 QR Code
- [ ] 「我的票券」正確顯示 QR Code 圖片
- [ ] 無法重複報名同一活動
- [ ] 活動額滿時無法報名

#### 4. 驗票功能
- [ ] Organizer 可進入驗票頁面
- [ ] 輸入有效 QR Code 可成功驗票
- [ ] 驗票後狀態變為 CHECKED_IN
- [ ] 重複驗票顯示「已簽到」錯誤
- [ ] 無效 QR Code 顯示錯誤
- [ ] Organizer 無法驗證其他人活動的票

#### 5. Walk-in 補登
- [ ] Organizer 可進行 Walk-in 補登
- [ ] 輸入 Email 與姓名後建立報名
- [ ] 補登的用戶直接標記為 CHECKED_IN
- [ ] 補登後出現在參加者名單

#### 6. 使用者體驗
- [ ] 所有 API 請求有 loading 狀態
- [ ] 成功操作有明確提示
- [ ] 錯誤訊息清楚易懂
- [ ] 按鈕在處理中時 disabled
- [ ] 表單有基本驗證
- [ ] 空狀態有適當提示

### 效能驗收

- [ ] 活動列表載入時間 < 2 秒
- [ ] QR Code 驗票 API 回應時間 < 1 秒
- [ ] 前端 build 檔案大小 < 500KB（gzip）

### 安全驗收

- [ ] 密碼不會在前端 log 中出現
- [ ] API 錯誤不會洩漏敏感資訊
- [ ] JWT Secret 不在程式碼中
- [ ] CORS 設定正確

---

## 風險與應對

### 風險 1：資料庫遷移問題
**風險等級**：中
**影響**：無法添加 status 欄位
**應對方案**：
- 開發階段：直接刪除並重建 SQLite 資料庫
- 如使用 Alembic：提前學習遷移指令
- 備案：手動執行 SQL `ALTER TABLE events ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';`

### 風險 2：CORS 問題
**風險等級**：低
**影響**：前端無法呼叫後端 API
**應對方案**：
- 確認後端 CORS middleware 配置正確
- 確認 allow_origins 包含前端 URL
- 使用瀏覽器 DevTools 查看 CORS 錯誤訊息
- 最壞情況：前後端使用同一 port（如 Nginx proxy）

### 風險 3：時間不足
**風險等級**：中
**影響**：無法完成所有功能
**優先順序調整**：
1. **必做**（P0）：活動審核、報名、QR Code 生成
2. **次要**（P1）：驗票功能
3. **選做**（P2）：Walk-in 補登、UI 優化

### 風險 4：前後端整合問題
**風險等級**：中
**影響**：API 格式不符，導致前端錯誤
**應對方案**：
- Day 1 完成後立即測試 API（使用 curl 或 Postman）
- 前後端約定好 API 格式（參考 openapi.yaml）
- 使用 TypeScript interface 確保型別一致
- 前端先用 mock 資料測試 UI

### 風險 5：測試資料不足
**風險等級**：低
**影響**：無法完整測試流程
**應對方案**：
- seed_data.py 建立足夠的測試資料
- 至少 3 個不同角色的用戶
- 至少 5 個不同狀態的活動
- 可重複執行 seed_data.py 重置資料

---

## 附錄

### A. API 端點總覽

| Method | Endpoint | 說明 | 權限 |
|--------|---------|------|------|
| POST | `/auth/login` | 登入 | Public |
| GET | `/auth/me` | 取得當前用戶 | Auth |
| GET | `/events` | 活動列表（僅 PUBLISHED） | Public |
| GET | `/events/pending` | 待審核活動列表 | Admin |
| GET | `/events/{id}` | 活動詳情 | Public |
| POST | `/events` | 建立活動 | Org/Admin |
| PATCH | `/events/{id}` | 更新活動 | Owner/Admin |
| PATCH | `/events/{id}/approve` | 核准活動 | Admin |
| PATCH | `/events/{id}/reject` | 駁回活動 | Admin |
| DELETE | `/events/{id}` | 刪除活動 | Owner/Admin |
| POST | `/events/{id}/registrations` | 報名活動 | Member |
| GET | `/me/registrations` | 我的票券 | Member |
| DELETE | `/registrations/{id}` | 取消報名 | Member |
| POST | `/verify` | 驗票 | Org/Admin |
| POST | `/walk-in` | 現場補登 | Org/Admin |
| GET | `/events/{id}/attendees` | 參加者名單 | Owner/Admin |
| GET | `/users` | 用戶列表 | Admin |
| PATCH | `/users/{id}/role` | 更新用戶角色 | Admin |

### B. 資料庫 Schema

```sql
-- Users
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    display_name VARCHAR NOT NULL,
    role VARCHAR(20) NOT NULL  -- MEMBER, ORGANIZER, ADMIN
);

-- Events
CREATE TABLE events (
    id VARCHAR PRIMARY KEY,
    organizer_id VARCHAR NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    start_at TIMESTAMP NOT NULL,
    end_at TIMESTAMP NOT NULL,
    location VARCHAR(200) NOT NULL,
    capacity INTEGER NOT NULL,
    registered_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL  -- NEW!
);

-- Registrations
CREATE TABLE registrations (
    id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    qr_code VARCHAR UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'REGISTERED',  -- REGISTERED, CHECKED_IN, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_title VARCHAR,  -- Denormalized
    event_start_at TIMESTAMP,  -- Denormalized
    UNIQUE(event_id, user_id)  -- 防止重複報名
);

-- Indexes
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_qr ON registrations(qr_code);
```

### C. 前端路由規劃

```typescript
// apps/web/App.tsx
<Routes>
  {/* Public */}
  <Route path="/login" element={<Login />} />

  {/* Member */}
  <Route path="/" element={<ProtectedRoute allowedRoles={['MEMBER', 'ORGANIZER', 'ADMIN']}><Events /></ProtectedRoute>} />
  <Route path="/events/:id" element={<ProtectedRoute allowedRoles={['MEMBER', 'ORGANIZER', 'ADMIN']}><EventDetail /></ProtectedRoute>} />
  <Route path="/my-tickets" element={<ProtectedRoute allowedRoles={['MEMBER', 'ORGANIZER', 'ADMIN']}><MyTickets /></ProtectedRoute>} />

  {/* Organizer */}
  <Route path="/verify/:eventId" element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}><OrganizerVerify /></ProtectedRoute>} />
  <Route path="/events/:id/attendees" element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}><EventAttendees /></ProtectedRoute>} />

  {/* Admin */}
  <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminEventApprovals /></ProtectedRoute>} />
  <Route path="/admin/create-event" element={<ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}><AdminCreateEvent /></ProtectedRoute>} />
  <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
</Routes>
```

### D. 參考資源

- **FastAPI 文檔**：https://fastapi.tiangolo.com/
- **React Router v6**：https://reactrouter.com/
- **SQLAlchemy 2.0**：https://docs.sqlalchemy.org/
- **QR Code React**：https://www.npmjs.com/package/qrcode.react
- **Axios**：https://axios-http.com/


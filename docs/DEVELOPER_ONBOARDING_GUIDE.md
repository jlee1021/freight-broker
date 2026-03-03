# FreightBroker Pro — 신입 개발자 온보딩·유지보수 가이드

> 이 솔루션을 **처음 접하는 개발자**가 읽고 나면, **무엇인지, 어떻게 돌아가는지, 구조는 어떤지** 전반을 이해하고 유지보수·기능 추가를 할 수 있도록 정리한 문서입니다.

---

## Part 1. 솔루션 개요

### 1.1 이 솔루션은 무엇인가?

**FreightBroker Pro**는 **화물 중개(프레이트 브로커) 업무**를 위한 **TMS(Transportation Management System)** 형태의 웹 애플리케이션입니다.

- **주 사용자**: 브로커사 내부 직원(디스패처, 세일즈, 빌링, 관리자) + **고객(Shipper)** 및 **캐리어(Carrier)** 가 로그인해 각자 관련 정보만 보는 **포털**.
- **핵심 업무**:
  - **로드(Load)** 관리: 한 건의 화물 이동을 하나의 "로드"로 만들고, Shipper/Consignee 구간, Carrier 구간, 요금, 상태를 관리.
  - **파트너** 관리: 고객(Customer)과 캐리어(Carrier)를 등록하고, 연락처·위치·스태프·캐리어 전용 정보(차량, 연락처 등)를 관리.
  - **인보이스**: 고객에게 청구하는 **AR(Customer Invoice)**, 캐리어에게 지급하는 **AP(Carrier Payable)** 생성·상태 관리·PDF/이메일.
  - **재고(Inventory)**: 창고별 항목, 수량·단가·총계 등.
  - **통합 로드(Consolidation)**: 여러 Shipper/Consignee를 하나의 통합 로드로 묶어 관리.
  - **EDI**: EDI 설정 및 EDI 레코드(발송 이력) 관리.
  - **설정**: 회사 기본값, 도시·유형·권한 마스터 데이터.

### 1.2 어떻게 돌아가는가? (사용자 관점)

1. **로그인**  
   - 이메일/비밀번호로 로그인 → JWT 토큰 발급 → 토큰을 저장하고 이후 API 요청마다 헤더에 붙여 인증.

2. **내부 사용자**  
   - Dashboard에서 요약 수치·최근 로드·연체 인보이스 등 확인.  
   - Dispatch → Order에서 로드 목록 조회/필터/일괄 상태 변경, 로드 상세에서 Shipper/Consignee/Carrier 구간·참조·문서 편집.  
   - Partner에서 고객·캐리어 목록/상세, Location/Staff/Contacts/Vehicles 관리.  
   - Account에서 AR/AP 목록, Expense, Debit/Credit, Item Type, (Admin) Users 관리.  
   - Inventory, Consolidation, EDI, Setting(Admin) 등에서 각 도메인 관리.

3. **포털 사용자(고객/캐리어)**  
   - 자신의 `partner_id`에 묶인 로드·인보이스(또는 페이어블)만 보는 전용 대시보드와 메뉴.

4. **백그라운드**  
   - AR 연체 리마인더: APScheduler로 매일 08:00에 연체 인보이스 대상에게 이메일 발송(설정 시).

---

## Part 2. 기술 스택

| 구분 | 기술 |
|------|------|
| **프론트엔드** | React 18, TypeScript, Vite, React Router, Tailwind CSS |
| **백엔드** | Python 3.11+, FastAPI |
| **DB** | PostgreSQL 15 |
| **ORM** | SQLAlchemy 2.x |
| **마이그레이션** | Alembic |
| **인증** | JWT (python-jose), bcrypt (비밀번호 해시) |
| **검증/직렬화** | Pydantic |
| **서버 실행** | uvicorn (ASGI), 개발 시 Vite dev server (프록시로 API 연동) |

---

## Part 3. 프로젝트 구조

```
freight-broker/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py          # 앱 진입점, CORS, 라우터 등록, 스케줄러, 시드
│   │   ├── core/            # 설정, DB, 보안
│   │   ├── api/             # 라우터, 의존성(deps)
│   │   │   ├── routes/      # 도메인별 엔드포인트
│   │   │   └── deps.py      # get_current_user 등
│   │   ├── models/          # SQLAlchemy 모델
│   │   ├── schemas/         # Pydantic 스키마
│   │   └── services/        # 비즈니스 로직(예: 리마인더)
│   ├── alembic/             # DB 마이그레이션
│   └── requirements.txt
├── frontend/                # React 프론트엔드
│   ├── src/
│   │   ├── main.tsx         # React 진입점
│   │   ├── App.tsx          # 라우팅, 레이아웃, 사이드바
│   │   ├── api.ts           # API 호출, 토큰 관리
│   │   ├── AuthContext.tsx  # 로그인 사용자 정보
│   │   ├── index.css        # Tailwind + 공통 클래스
│   │   └── pages/           # 페이지 컴포넌트
│   └── vite.config.ts
└── docs/                    # 문서
```

---

## Part 4. 백엔드 상세

### 4.1 진입점: `main.py`

- **FastAPI 앱** 생성, `api_v1_prefix`(기본 `/api/v1`)로 API 라우터 포함.
- **CORS**: `cors_origins` 설정값(쉼표 구분)만 허용. 로컬은 `http://localhost:5173` 등.
- **startup**  
  - APScheduler 시작 → 매일 08:00 AR 리마인더 job 등록.  
  - DB에 사용자가 한 명도 없으면 기본 Admin 계정 생성 (`admin@local` / `admin123`).
- **/health**: `{"status": "ok"}` 반환 (헬스체크용).
- **/**: API 안내 + `docs: "/docs"` (Swagger UI).

### 4.2 설정: `core/config.py`

- **pydantic-settings**로 환경변수·`.env` 로드.
- 주요 항목: `database_url`, `api_v1_prefix`, `cors_origins`, `secret_key`, `access_token_expire_minutes`, SMTP 관련(`smtp_host`, `from_email` 등), `upload_dir`.
- `get_settings()`는 `@lru_cache`로 싱글톤.

### 4.3 DB: `core/database.py`

- **SQLAlchemy** `create_engine` + `SessionLocal` (sessionmaker).
- **get_db()**: FastAPI 의존성으로 사용. 요청마다 세션 생성, yield 후 `close()`.
- 모든 모델은 `Base = declarative_base()` 상속.

### 4.4 보안: `core/security.py`

- **비밀번호**: `bcrypt`로 해시/검증.
- **JWT**: `jose`. `create_access_token(subject=str(user.id))`, `decode_access_token(token)` → user id 또는 None.
- 만료 시간은 `access_token_expire_minutes` 적용.

### 4.5 인증 의존성: `api/deps.py`

- **HTTPBearer**로 `Authorization: Bearer <token>` 추출.
- **get_current_user**: 토큰 검증 → user id → DB에서 User 조회. 없거나 실패 시 401.
- **require_roles(allowed_roles)**: 허용 role만 통과시키는 의존성(예: Admin 전용 라우트).

### 4.6 API 라우터 구성: `api/__init__.py`

- **인증 없음**: `/auth` (로그인), `/tenders` 공개(토큰 링크 수락 등).
- **인증 필요(protected)**: `get_current_user` 의존성이 붙은 라우터들.
  - `/loads`, `/partners`, `/users`, `/stats`, `/documents`, `/settings`, `/inventory`, `/invoices`, `/master`, `/account`, `/consolidations`, `/edi` 등.
- 각 도메인은 `routes/` 아래 별도 파일(예: `loads.py`, `partners.py`)에서 라우터를 정의하고, `__init__.py`에서 `include_router`로 묶음.

### 4.7 모델: `models/`

- **User**: id, email, hashed_password, full_name, role, partner_id (FK). 포털 사용자는 partner_id로 고객/캐리어와 연결.
- **Partner**: name, type(customer/carrier), 연락처·주소, MC/DOT, 확장 필드(code, legal_name, payment_days 등).  
  - **PartnerLocation**, **PartnerStaff**, **CarrierContact**, **CarrierVehicle**: partner와 1:N.
- **Load**: load_number, status, customer_id, rate, revenue, cost, equipment_type, bill_to, order_id 등.  
  - **ShipperStop**, **ConsigneeStop**, **CarrierSegment**, **Reference**: load와 1:N.
- **LoadAttachment**, **LoadNote**, **Tender**: 로드 첨부·노트·견적 요청.
- **CustomerInvoice**, **CarrierPayable**: AR/AP.
- **Warehouse**, **InventoryItem**: 재고.
- **Setting**: 회사명, 로고, 기본 세금/FSC 등 키-값.
- **City**, **TypeMaster**, **SubTypeMaster**, **Permission**: 마스터 데이터.
- **ItemType**, **Expense**, **ExpenseDetail**, **DebitCredit**: 회계 확장.
- **Consolidation**, **ConsolidationShipper**, **ConsolidationConsignee**: 통합 로드.
- **EdiConfig**, **EdiRecord**: EDI.

모델은 `models/__init__.py`에서 한꺼번에 export. 관계(relationship)로 역참조 가능.

### 4.8 스키마: `schemas/`

- Pydantic 모델로 **요청 body**(Create, Update)와 **응답**(Response) 정의.
- API에서는 `response_model=SomeResponse`, `payload: SomeCreate` 형태로 사용. ORM 객체를 Response로 변환할 때 `from_orm` 또는 `model_validate` 활용.

### 4.9 라우트 패턴 (예: loads, partners)

- **목록**: `GET /loads` — 쿼리 파라미터(status, q, date_from, customer_id 등)로 필터, `limit`/offset, JSON `{ "items": [...] }` 반환.
- **상세**: `GET /loads/{id}` — 단일 로드 + 관계(Shipper/Consignee/Carrier 등) 포함.
- **생성**: `POST /loads` — body를 Create 스키마로 검증 후 DB insert, 201 + 생성된 리소스.
- **수정**: `PATCH /loads/{id}` — 부분 수정.
- **삭제**: `DELETE /loads/{id}` — 204.
- **하위 리소스**: 예) `POST /loads/{id}/shipper-stops`, `GET /partners/{id}/locations` 등.

인증이 필요한 라우트는 `Depends(get_current_user)` 또는 `require_roles(["admin"])` 사용.

### 4.10 마이그레이션 (Alembic)

- **위치**: `backend/alembic/`, `alembic/versions/` 아래에 `012_...py`, `013_...py` 형태로 버전별 스크립트.
- **명령**: `alembic upgrade head` — 최신까지 적용. `alembic revision --autogenerate` — 모델 변경 시 새 리비전 생성(수동 검토 후 사용).

---

## Part 5. 프론트엔드 상세

### 5.1 진입점: `main.tsx`

- React DOM 렌더링, `BrowserRouter`로 `App` 감싸서 라우팅 활성화.

### 5.2 라우팅·레이아웃: `App.tsx`

- **경로**  
  - `/login`: 로그인 페이지(비인증 전용).  
  - `/*`: `RequireAuth` → 토큰 없으면 `/login`으로 리다이렉트.  
  - 그 안에서 `AuthProvider`로 감싼 뒤 `AppLayout`이 실제 레이아웃(사이드바 + 메인).
- **AppLayout**  
  - **사이드바**: `SidebarNav` — 사용자 유형(포털/내부, Admin 여부)에 따라 메뉴 다르게 표시.  
  - **메인**: `<Routes>`로 페이지 컴포넌트 매핑(/, /order, /order/new, /order/:loadId, /partner, /partner/new, /partner/:partnerId, /profit, /profit/expense-detail, /invoicing, /account, /account/ar, /account/ap, /account/expense, … /reports, /inventory, /consolidation, /edi, /setting).
- **권한**: `RequireAdmin`으로 Setting, Account 내 일부(Expense, Debit/Credit, Item Type, Users)는 Admin만 접근.
- **에러**: `PageErrorBoundary`로 자식 렌더 중 에러 잡아서 메시지 + "다시 시도" 버튼 표시.

### 5.3 인증·사용자 정보: `AuthContext.tsx`

- **AuthProvider**: 마운트 시 `GET /auth/me` 호출 → `setMe(user | null)`.
- **useMe()**: 현재 로그인 사용자 (id, email, role, partner_id, partner_name, partner_type 등). 로딩 중이면 undefined.
- **useIsAdmin()**: role === 'admin'.
- **useIsPortalUser()**: partner_id가 있으면 true (고객/캐리어 포털).

사이드바와 라우트 가드에서 이 훅을 사용해 메뉴/접근 제어.

### 5.4 API 호출: `api.ts`

- **API_BASE**: localhost가 아니면 `현재 호스트:8000/api/v1`, 로컬이면 `/api/v1`(Vite 프록시로 8000 전달).
- **getToken / setToken / clearToken**: localStorage의 `token` 키.
- **apiFetch(url, options)**:  
  - `Authorization: Bearer <token>` 추가.  
  - body가 문자열이면 `Content-Type: application/json` 설정.  
  - 401이면 토큰 삭제 후 `/login`으로 이동.  
  - !res.ok이면 body.detail 등으로 에러 메시지 만들어 throw.
- **apiJson<T>(url, options)**: apiFetch 후 `.json()` 반환.

모든 페이지는 `apiJson`, `apiFetch`로 백엔드 호출. 로그인만 `fetch(buildUrl('/auth/login'), ...)`로 직접 호출 후 `setToken(data.access_token)`.

### 5.5 스타일: `index.css`

- Tailwind `@tailwind base/components/utilities`.
- **공통 클래스**: `.page-title`, `.card`, `.table-wrap`, `.table-header`, `.btn-primary`, `.btn-secondary` (Tailwind `@apply`로 정의).

### 5.6 페이지 컴포넌트 (`pages/`)

- 각 파일은 **한 라우트에 대응**하는 기본 export 컴포넌트.
- **공통 패턴**:  
  - `useState`로 목록/선택/폼 상태 관리.  
  - `useEffect`로 마운트 시 또는 의존성 변경 시 API 호출(`apiJson`).  
  - 테이블 + "Add" 버튼 → 모달에서 폼 입력 → `apiFetch` POST/PATCH 후 목록 재조회.  
  - URL과 연동이 필요하면 `useSearchParams`, `useLocation`, `useNavigate` 사용(예: Partner `?type=customer`, Setting `?tab=city`, Account `/account/expense`).
- **탭이 있는 페이지**: Account, Setting, PartnerDetail, Edi — 내부에서 탭 상태 또는 URL과 동기화해 조건부로 다른 블록 렌더.

---

## Part 6. 인증 흐름 (요약)

1. 사용자가 로그인 페이지에서 이메일/비밀번호 제출.  
2. `POST /api/v1/auth/login` → 백엔드가 User 조회, 비밀번호 검증, JWT 발급(subject=user.id).  
3. 프론트는 `access_token`을 localStorage에 저장, `/` 등으로 이동.  
4. 이후 모든 API 요청에 `Authorization: Bearer <token>` 포함.  
5. 백엔드 `get_current_user`가 토큰 검증 후 User 반환.  
6. `/auth/me`로 현재 사용자 정보(role, partner_id 등) 조회 → AuthContext에 저장 → 사이드바/라우트 가드에 사용.  
7. 401 수신 시 프론트는 토큰 삭제 후 `/login`으로 리다이렉트.

---

## Part 7. 로컬 실행 방법

### 7.1 DB

- PostgreSQL 15 실행(로컬 또는 Docker).  
- `backend/.env`에 `DATABASE_URL=postgresql://user:pass@host:port/dbname` 설정.

### 7.2 백엔드

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: `http://localhost:8000`, Swagger: `http://localhost:8000/docs`.

### 7.3 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

- 기본: `http://localhost:5173`. Vite가 `/api`를 8000으로 프록시하므로 같은 호스트에서 개발 가능.  
- 기본 Admin: `admin@local` / `admin123` (시드로 생성됨).

---

## Part 8. 기능 추가 시 참고 (패턴)

### 8.1 새 “마스터” 도메인 추가 (예: 새 목록/상세 화면)

1. **백엔드**  
   - `models/`에 SQLAlchemy 모델 정의.  
   - `alembic revision`으로 마이그레이션 생성 및 `upgrade head`.  
   - `schemas/`에 Create/Update/Response 스키마.  
   - `api/routes/`에 새 라우터(CRUD).  
   - `api/__init__.py`에서 `protected.include_router(..., prefix="/xxx", tags=["xxx"])`.

2. **프론트**  
   - `pages/`에 새 페이지 컴포넌트(목록 + 모달 또는 상세 폼).  
   - `App.tsx`의 SidebarNav에 메뉴 링크 추가, Routes에 `<Route path="/xxx" element={<XxxPage />} />` 추가.

### 8.2 기존 페이지에 필드/컬럼 추가

- **백엔드**: 모델에 컬럼 추가 → Alembic 마이그레이션 → 스키마·라우트는 기존 구조 유지(필요 시 스키마만 필드 추가).  
- **프론트**: 해당 페이지 tsx에서 테이블 `<th>`/`<td>` 및 폼 input 추가, API 요청/응답 타입에 필드 반영.

### 8.3 새 API 엔드포인트만 추가

- `api/routes/` 해당 파일에 새 라우트 함수 추가.  
- 필요 시 `schemas`에 요청/응답 모델 추가.  
- 프론트에서는 `apiJson`/`apiFetch`로 호출.

---

## Part 9. 배포 개요

- **백엔드**: 서버에서 `uvicorn app.main:app --host 0.0.0.0 --port 8000` (또는 systemd 등으로 상시 실행).  
- **프론트**: `npm run build` 후 `dist/`를 Nginx 등으로 서빙하거나, 개발 모드로 `npm run dev -- --host 0.0.0.0` (포트 5173).  
- **DB**: PostgreSQL 서버 또는 Docker 컨테이너. `alembic upgrade head`로 스키마 적용.  
- **환경**: `.env`에 `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS` 등 운영값 설정.  
- 상세 배포 절차는 `docs/INSTALL.md`, `docs/ubuntu-server-run.md` 등 프로젝트 내 배포 문서 참고.

---

## Part 10. 문서·추가 학습

| 문서 | 용도 |
|------|------|
| `FRONTEND_UI_GUIDE.md` | UI 구성·페이지별 요소·수정 위치 (디자이너/관리자용) |
| `COMPARISON_TMS_AND_CLONE_TARGET.md` | 참조 솔루션과 기능 비교 |
| `WEB_STRUCTURE_ANALYSIS.md` | 메뉴 구조·참조와의 차이 |
| `IMPLEMENTATION_COMPLETE.md` | clone 체크리스트 구현 요약 |
| `INSTALL.md`, `USER_MANUAL.md` | 설치·사용자 매뉴얼 |

---

이 가이드를 읽은 후에는 **솔루션의 목적**, **기술 스택**, **백엔드(진입점·설정·DB·인증·라우터·모델)** 와 **프론트엔드(라우팅·인증·API 레이어·페이지 패턴)** 를 한 번에 파악할 수 있습니다.  
버그 수정이나 기능 추가 시에는 위 **Part 8** 패턴과 해당 도메인의 `models/`, `api/routes/`, `pages/` 파일을 함께 보면 됩니다.

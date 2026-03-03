# FreightBroker Pro — 프론트엔드 UI 구성 가이드 (디자이너·관리자용)

> 이 문서는 **디자이너**와 **관리자**가 현재 웹 UI가 어떻게 구성되어 있는지 이해하고, 수정 요청 시 "어디를 어떻게 바꾸면 되는지"를 명확히 하기 위한 설명서입니다.

---

## 1. 전체 레이아웃

### 1.1 화면 구성

- **좌측**: 고정 너비(약 14rem, 224px) **사이드바** — 배경 `slate-800`(진한 회색), 텍스트 흰색/밝은 회색.
- **우측**: **메인 콘텐츠 영역** — 배경 `gray-100`, 상하 스크롤 가능, 패딩 `p-6`.
- **사이드바 상단**: 앱명("Freight Broker Pro") 또는 포털 사용자일 경우 "Carrier Portal" / "Customer Portal" + 파트너명.
- **사이드바 하단**: Logout 버튼.

### 1.2 사용자 유형별 노출

| 사용자 유형 | 설명 | 사이드바에 보이는 메뉴 |
|-------------|------|------------------------|
| **내부 사용자** (role: admin, dispatcher, sales, billing) | partner_id 없음 | Dashboard + Dispatch / Partner / Profit / Account / Inventory / Setting (Admin만 Setting) |
| **포털 사용자** (고객 또는 캐리어) | partner_id 있음 | Dashboard, My Loads(또는 My Invoices), My Payables(또는 My Invoices), Logout |

---

## 2. 네비게이션 구조 (사이드바)

### 2.1 계층 구조

내부 사용자 기준으로 **상위 메뉴 → 하위 메뉴** 형태입니다. 상위 메뉴를 클릭하면 하위가 **펼쳐지거나 접힙니다**. 현재 보고 있는 페이지가 속한 상위 메뉴는 자동으로 펼쳐진 상태로 유지됩니다.

| 상위 메뉴 | 아이콘 | 하위 메뉴 | 이동 경로 |
|-----------|--------|-----------|-----------|
| (단일) | — | Dashboard | `/` |
| **Dispatch** | 상자 아이콘 | Order | `/order` |
| | | Consolidation | `/consolidation` |
| | | OSD | `/reports` |
| | | EDI | `/edi` |
| **Partner** | 사람 아이콘 | Customer | `/partner?type=customer` |
| | | Location | `/partner` |
| | | Carrier | `/partner?type=carrier` |
| | | Staff | `/partner` |
| **Profit** | 달러 아이콘 | Customer | `/profit` |
| | | Expense Detail | `/profit/expense-detail` |
| **Account** | 책 아이콘 | AR List | `/account/ar` |
| | | AP List | `/account/ap` |
| | | Expense | `/account/expense` |
| | | Debit / Credit | `/account/debit-credit` |
| | | Item Type List | `/account/item-type` |
| | | Users (Admin만) | `/account/users` |
| **Inventory** | 상자 아이콘 | List | `/inventory` |
| **Setting** (Admin만) | 톱니바퀴 아이콘 | Default | `/setting` |
| | | City | `/setting?tab=city` |
| | | Type | `/setting?tab=type` |
| | | Permission | `/setting?tab=permission` |

### 2.2 수정 시 참고

- **메뉴 이름/순서 변경**: `frontend/src/App.tsx` 안의 `SidebarNav` 함수에서 텍스트와 `NavLink to="..."` 를 수정하면 됩니다.
- **아이콘 변경**: 같은 파일 상단의 `IconDispatch`, `IconPartner` 등 SVG 컴포넌트를 교체하면 됩니다.
- **색상**: 활성/호버는 `bg-slate-600`, `hover:bg-slate-700` 등 Tailwind 클래스로 지정되어 있습니다. 배경은 `bg-slate-800`입니다.

---

## 3. 페이지별 UI 구성

아래는 **메인 영역**에 표시되는 각 페이지의 제목, 블록 구성, 버튼/테이블 패턴을 정리한 것입니다. "수정할 부분"은 디자인/기능 변경 시 찾아볼 위치입니다.

### 3.1 로그인 (`/login`)

- **구성**: 전체 화면 중앙에 카드 1개. 제목 "Freight Broker", 이메일/비밀번호 입력, 로그인 버튼, 에러 메시지 영역.
- **스타일**: 카드 `bg-white rounded-lg shadow`, 입력창 `border rounded px-3 py-2`, 버튼 `bg-red-600 text-white`.
- **수정할 부분**: `frontend/src/pages/Login.tsx` — 레이아웃, 문구, 버튼/입력 스타일.

---

### 3.2 Dashboard (`/`)

- **구성**:
  - 상단: "Dashboard" 제목 (`page-title` 클래스).
  - 알림 배너: 연체 인보이스 수, 보험 만료 예정 캐리어 수 (있을 때만 표시).
  - 카드 그리드: Total Loads, Revenue, Cost, Profit, AR Outstanding(있을 경우). 각 카드에 숫자 + 링크.
  - Recent Loads: 최근 로드 목록(링크).
  - Loads by Status: 상태별 개수 버튼(클릭 시 Order 목록 필터).
- **수정할 부분**: `frontend/src/pages/Dashboard.tsx` — 카드 개수/순서, 라벨, 그리드 열 수(`grid-cols-4` 등).

---

### 3.3 Order (로드 목록) (`/order`)

- **구성**:
  - 상단: "Orders" 제목, New Load 버튼.
  - 상태 탭: pending, unassigned, on_hold, need_to_cover, assigned, in_transit, delivered, cancel.
  - 필터: 검색어, 날짜(From/To), 고객(드롭다운).
  - 테이블: Load#, Status, Customer, Rate, Revenue, Cost, Created, 체크박스, Actions(View 등).
  - 일괄 작업: 선택 로드에 대해 상태 일괄 변경.
- **수정할 부분**: `frontend/src/pages/Order.tsx` — 탭 목록, 테이블 컬럼, 필터 항목, 버튼 문구.

---

### 3.4 Load 상세 / 신규 (`/order/new`, `/order/:loadId`)

- **구성**: 로드 기본 정보, Shipper/Consignee 구간, Carrier 구간, Reference, 첨부파일, 노트 등 폼/테이블이 섹션별로 나열. 저장/삭제 버튼.
- **수정할 부분**: `frontend/src/pages/LoadDetail.tsx` — 필드 순서, 섹션 구분, 라벨, 필수값.

---

### 3.5 Partner (파트너 목록) (`/partner`)

- **구성**:
  - 상단: "Partner" 제목, New Partner 버튼.
  - 필터 버튼: All / Customer / Carrier (URL `?type=customer` 또는 `?type=carrier`과 연동).
  - 테이블: Name, Type, City, Contact, 행 클릭 또는 링크로 상세 이동.
- **수정할 부분**: `frontend/src/pages/Partner.tsx` — 테이블 컬럼, 필터 버튼 스타일.

---

### 3.6 Partner 상세 (`/partner/:partnerId`, `/partner/new`)

- **구성**: **탭** — Detail, Locations, Staff, Contacts(캐리어만), Vehicles(캐리어만).
  - **Detail**: 파트너 기본 정보 + 캐리어 전용 필드(MC, DOT, Legal Name, Payment Days 등) 폼.
  - **Locations**: 테이블 + Add Location 모달.
  - **Staff**: 테이블 + Add Staff 모달.
  - **Contacts / Vehicles**: 캐리어일 때만 표시, 테이블 + 추가 모달.
- **수정할 부분**: `frontend/src/pages/PartnerDetail.tsx` — 탭 이름, 각 탭 내 필드/테이블/모달.

---

### 3.7 Profit (`/profit`)

- **구성**: "Profit" 제목, 카드 1개에 Total Revenue, Total Cost, Profit (CAD) 표시.
- **수정할 부분**: `frontend/src/pages/Profit.tsx` — 레이아웃, 라벨, 소수 자리수.

---

### 3.8 Profit – Expense Detail (`/profit/expense-detail`)

- **구성**: 제목 + 안내 문구 + "Account → Expense" 링크.
- **수정할 부분**: `frontend/src/pages/App.tsx` 내 `ProfitExpenseDetail` 또는 별도 페이지로 분리 후 문구/링크.

---

### 3.9 Account – AR List / AP List (`/account/ar`, `/account/ap`)

- **구성**:
  - **AR List**: AR – Customer Invoices 제목, All/Overdue 필터, "Select load to invoice" 드롭다운 + Create Invoice, 테이블(Invoice #, Load, Customer, Amount, Due, Status, Last Reminder, Actions: View, PDF, Mark Sent, Mark Paid, Send reminder).
  - **AP List**: AP – Carrier Payables 테이블(#, Load, Carrier, Amount, Status, View, PDF, Mark Paid).
- **수정할 부분**: `frontend/src/pages/Invoicing.tsx` — `viewMode`에 따라 AR만/AP만/전체 표시. 테이블 컬럼, 버튼, 필터.

---

### 3.10 Account – Expense / Debit/Credit / Item Type / Users (`/account/expense` 등)

- **구성**: "Account" 제목 아래 **탭** — Users, Item Type List, Expense, Debit / Credit. 탭별로 테이블 + 추가/수정 모달.
- **수정할 부분**: `frontend/src/pages/Account.tsx` — 탭 순서/이름, 각 탭 내 테이블 컬럼·모달 필드.

---

### 3.11 Invoicing (레거시) (`/invoicing`)

- **구성**: AR 섹션 + AP 섹션이 한 페이지에 함께 표시(Account의 AR/AP와 동일 컴포넌트).
- **수정할 부분**: `frontend/src/pages/Invoicing.tsx` — `viewMode='all'`일 때의 레이아웃. 사이드바에서 이 경로를 제거하거나 유지하는 것은 `App.tsx`에서 결정.

---

### 3.12 Reports (`/reports`)

- **구성**: 리포트 선택 및 결과 표시(그룹별 수익 등).
- **수정할 부분**: `frontend/src/pages/Reports.tsx` — 필터, 테이블/차트.

---

### 3.13 Inventory (`/inventory`)

- **구성**: 창고 선택(드롭다운 또는 "전체"), 검색/날짜 필터, 항목 테이블(Item#, Name, Size, Qty, Cost, Total, Entry Date, Note 등), Add Item 모달, 합계 행.
- **수정할 부분**: `frontend/src/pages/Inventory.tsx` — 테이블 컬럼, 모달 필드, 필터 UI.

---

### 3.14 Consolidation (`/consolidation`)

- **구성**: 좌측 통합 로드 목록, 우측 선택 로드의 상세(Shipper/Consignee 테이블). 추가 모달.
- **수정할 부분**: `frontend/src/pages/Consolidation.tsx` — 목록/상세 비율, 테이블 컬럼, 모달.

---

### 3.15 EDI (`/edi`)

- **구성**: **탭** — EDI Config, EDI List. Config는 설정 테이블+모달, List는 레코드 테이블+필터.
- **수정할 부분**: `frontend/src/pages/Edi.tsx` — 탭 이름, 테이블 컬럼, 필터, 모달.

---

### 3.16 Setting (`/setting`, `/setting?tab=...`)

- **구성**: "Setting" 제목 아래 **탭** — Default, City, Type/SubType, Permission. 탭별로 테이블 + 추가/수정 모달. URL `?tab=city` 등과 연동.
- **수정할 부분**: `frontend/src/pages/Setting.tsx` — 탭 순서/이름, Default 탭의 설정 항목, City/Type/Permission 테이블·모달.

---

### 3.17 Portal Dashboard (`/` — 포털 사용자)

- **구성**: 고객/캐리어용 대시보드. 내 로드, 내 인보이스/페이어블 요약 등.
- **수정할 부분**: `frontend/src/pages/PortalDashboard.tsx`.

---

## 4. 공통 UI 요소 (디자인 시스템)

### 4.1 CSS 클래스 (Tailwind + index.css)

전역으로 정의된 클래스는 `frontend/src/index.css`에 있습니다.

| 클래스명 | 용도 |
|----------|------|
| `.page-title` | 페이지 상단 제목 (크기·굵기·색·여백) |
| `.card` | 흰 배경 카드 (둥근 모서리, 그림자, 테두리, 패딩) |
| `.table-wrap` | 테이블 가로 스크롤 감싸기 |
| `.table-header` | 테이블 thead 스타일 (배경·글자색) |
| `.btn-primary` | 주 버튼 (빨간 배경, 흰 글자, hover, disabled) |
| `.btn-secondary` | 보조 버튼 (흰 배경, 테두리) |

- **수정할 부분**: `frontend/src/index.css` — 여기서 카드/버튼/테이블의 전역 느낌을 바꿀 수 있습니다. 개별 페이지는 해당 tsx 파일에서 Tailwind 클래스를 직접 씁니다.

### 4.2 모달 패턴

대부분의 "추가/수정" 폼은 **전체 화면 덮는 모달**로 구현되어 있습니다.

- 배경: 반투명 검정 (`fixed inset-0 bg-black/40`).
- 모달 박스: 흰 배경, `max-w-lg`, `rounded-xl`, 상단에 제목 + 닫기(×), 하단에 입력 필드·저장 버튼.
- **수정할 부분**: 각 페이지 내부에 `Modal` 컴포넌트가 인라인으로 정의된 경우가 많습니다. 제목/필드/버튼은 해당 페이지 tsx에서 수정하면 됩니다.

### 4.3 테이블 패턴

- `min-w-full`, thead에 `table-header` 또는 `bg-gray-50`, tbody에 `border-t`, 호버 `hover:bg-gray-50`.
- Actions 열에 "Edit", "Delete", "View" 등 링크/버튼.
- **수정할 부분**: 각 페이지의 `<table>` 구조와 `<th>`/`<td>` 내용.

### 4.4 주요 색상

- **강조/주요 버튼**: `red-600` / `red-700` (hover).
- **사이드바**: `slate-800` (배경), `slate-200` (텍스트), `slate-600` (선택 시).
- **카드/본문**: `white`, `gray-100` (배경), `gray-600`/`gray-800` (텍스트).
- **링크**: `blue-600`, `hover:underline`.
- **에러/경고**: `red-50`/`red-800`, `amber-50`/`amber-800` 등.

---

## 5. 수정 시 찾아볼 파일 요약

| 수정 목적 | 주로 볼 파일 |
|-----------|----------------|
| 메뉴 이름·순서·아이콘·경로 | `frontend/src/App.tsx` (SidebarNav, 라우트) |
| 로그인 화면 | `frontend/src/pages/Login.tsx` |
| 대시보드 | `frontend/src/pages/Dashboard.tsx` |
| 로드 목록/상세 | `frontend/src/pages/Order.tsx`, `LoadDetail.tsx` |
| 파트너 목록/상세 | `frontend/src/pages/Partner.tsx`, `PartnerDetail.tsx` |
| 이익 | `frontend/src/pages/Profit.tsx` |
| AR/AP (인보이스) | `frontend/src/pages/Invoicing.tsx` |
| Account 탭 전체 | `frontend/src/pages/Account.tsx` |
| 리포트 | `frontend/src/pages/Reports.tsx` |
| 재고 | `frontend/src/pages/Inventory.tsx` |
| 통합 로드 | `frontend/src/pages/Consolidation.tsx` |
| EDI | `frontend/src/pages/Edi.tsx` |
| 설정 | `frontend/src/pages/Setting.tsx` |
| 전역 제목·카드·버튼 스타일 | `frontend/src/index.css` |

---

## 6. 반응형·접근성

- **반응형**: 그리드는 `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` 등 Tailwind 브레이크포인트 사용. 테이블은 `table-wrap`으로 가로 스크롤.
- **접근성**: 포커스 링크/버튼은 브라우저 기본 포커스 링블 처리. 필요 시 `focus:` 클래스나 aria 속성은 각 컴포넌트에서 추가 가능합니다.

이 문서를 기준으로 "어느 페이지의 어떤 블록/버튼/테이블을 어떻게 바꾸고 싶다"고 요청하시면, 개발자가 해당 파일과 위치를 빠르게 찾을 수 있습니다.

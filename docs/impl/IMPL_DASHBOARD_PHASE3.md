# Dashboard Phase 3 구현 정리

> **목적**: 타사 대시보드 참고 이미지처럼 **Top 10 Customers**, **Recently Dispatched Carriers** 테이블을 추가하고, 모든 요소를 **클릭 시 해당 페이지로 이동**하도록 구성한다.  
> **참고**: `docs/DASHBOARD_UI_UX_REFERENCE.md` Phase 3, 사용자 제공 대시보드 레이아웃 이미지  
> **작성일**: 2026-03-03  

---

## 1. Phase 3 목표 (요약)

| 항목 | 내용 |
|------|------|
| **Top 10 Customers** | 선택 기간 기준 수익 상위 10명, Balance(AR)·Income·Cost·Profit·Ratio % 테이블, 클릭 시 파트너/주문 페이지 |
| **Recently Dispatched Carriers** | 최근 배차된 로드 기준 캐리어 10건, Date·Carrier·Load 테이블, 클릭 시 캐리어/로드 상세 |
| **클릭 네비게이션** | 고객명 → 파트너 상세, View → 주문 목록(고객 필터) / 캐리어명 → 파트너 상세, Load#·View → 로드 상세 |

---

## 2. 백엔드 변경

### 2.1 파일

- `backend/app/api/routes/stats.py`

### 2.2 GET /stats/dashboard 응답 확장

- **top_customers** (배열)
  - 선택 기간(`date_from`/`date_to`) 내 로드 기준, 고객(customer_id)별 revenue 합계로 정렬 후 상위 10명.
  - 각 항목: `customer_id`, `name`, `balance`, `income`, `cost`, `profit`, `ratio`.
  - **balance**: 해당 고객의 미수금 합계 (CustomerInvoice에서 status in draft/sent인 amount 합계).
  - **income**: revenue 합계, **cost**: cost 합계, **profit**: income - cost.
  - **ratio**: profit / income * 100 (소수 1자리), income 0이면 null.
  - customer_id 없음은 `"_no_customer"`, name `"No customer"`.

- **recently_dispatched_carriers** (배열)
  - 캐리어 세그먼트가 있는 로드만 대상, `updated_at` 내림차순(없으면 `created_at`) 후 상위 10건.
  - 각 로드에서 대표 캐리어 1명(첫 번째 carrier_id 있는 세그먼트 또는 첫 세그먼트).
  - 각 항목: `date` (로드 updated_at 또는 created_at), `carrier_name`, `carrier_id`, `load_id`, `load_number`.

### 2.3 구현 요약

- `get_dashboard_stats` 내에서:
  - 기간 필터 적용된 Load 목록으로 고객별 집계 → 상위 10명, balance는 CustomerInvoice 집계로 계산.
  - `Load` + `carrier_segments` joinedload, `Load.carrier_segments.any()` 필터, `order_by(Load.updated_at.desc().nullslast(), Load.created_at.desc())`, limit 10.
- balance 계산 시 `customer_id == UUID(cid)` 예외 처리 (invalid UUID 시 0).

---

## 3. 프론트엔드 변경

### 3.1 파일

- `frontend/src/pages/Dashboard.tsx`

### 3.2 레이아웃 (참고 이미지 스타일)

- **상단**: 제목 + 기간 선택 (Phase 2).
- **Alerts** (기존).
- **KPI 카드** (기존 + Phase 2 %).
- **2열 그리드** (Phase 3):
  - **왼쪽**: **Top 10 Customers** 테이블.
  - **오른쪽**: **Recently Dispatched Carriers** 테이블.
- **Profit (Loads) by period** 차트 (Phase 2).
- **Recent Loads** 테이블 (기존).
- **Loads by Status** (기존).

### 3.3 Top 10 Customers 테이블

- 컬럼: Customer, Balance, Income, Cost, Profit, Ratio %, Actions.
- **클릭 가능 요소**
  - **Customer 이름**: `customer_id !== '_no_customer'`일 때 `Link` to `/partner/${customer_id}` (파트너 상세).
  - **Actions**: `Link` to `/order?customer_id=${customer_id}` (해당 고객 주문 목록).
- 헤더 우측: "View all →" to `/partner?type=customer`.

### 3.4 Recently Dispatched Carriers 테이블

- 컬럼: Date, Carrier, Load, Actions.
- **클릭 가능 요소**
  - **Carrier 이름**: `carrier_id` 있으면 `Link` to `/partner/${carrier_id}`.
  - **Load 번호**: `Link` to `/order/${load_id}` (로드 상세).
  - **Actions**: `Link` to `/order/${load_id}` ("View").
- 헤더 우측: "View all →" to `/partner?type=carrier`.

### 3.5 기존 섹션 클릭 정리

- **KPI**: Total Loads, AR Outstanding 카드 → `/order`, `/account/ar` (기존).
- **Recent Loads**: Load#·View → `/order/:id` (기존).
- **Loads by Status**: 각 행 → `/order?status=...`, 하단 "View all orders →" → `/order` (기존).
- **Alerts**: View AR → `/account/ar`, View Carriers → `/partner?type=carrier` (기존).

---

## 4. 수정·추가된 파일 목록

| 파일 | 변경 |
|------|------|
| `backend/app/api/routes/stats.py` | top_customers, recently_dispatched_carriers 집계 및 응답 추가 |
| `frontend/src/pages/Dashboard.tsx` | Top 10 Customers·Recently Dispatched Carriers 테이블, 링크 연결 |

---

## 5. Before / After 요약

| 영역 | Before | After |
|------|--------|--------|
| 고객/캐리어 요약 | 없음 | Top 10 Customers + Recently Dispatched Carriers 테이블 |
| 클릭 | KPI·Recent·Status·Alerts만 | 고객명→파트너, 캐리어명→파트너, Load#→로드, View→목록/상세 등 전반 링크 |

---

## 6. 테스트 체크리스트

- [ ] 기간 선택 시 Top 10 Customers가 해당 기간 수익 기준으로 나오는지
- [ ] Top 10에서 고객명 클릭 시 해당 파트너 상세(/partner/:id)로 이동하는지
- [ ] Top 10에서 View 클릭 시 /order?customer_id=:id 로 이동하는지
- [ ] Recently Dispatched Carriers에서 캐리어명 클릭 시 파트너 상세로, Load#/View 클릭 시 로드 상세로 이동하는지
- [ ] "View all →" (Customers / Carriers)가 /partner?type=customer, /partner?type=carrier 로 이동하는지

---

## 7. 참고

- Phase 1: `docs/impl/IMPL_DASHBOARD_PHASE1.md`
- Phase 2: `docs/impl/IMPL_DASHBOARD_PHASE2.md`
- 타사 참고: `docs/DASHBOARD_UI_UX_REFERENCE.md`

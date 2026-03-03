# Dashboard Phase 1 UI/UX 구현 정리

> **목적**: 타사 Freight Broker/TMS 대시보드 참고(`DASHBOARD_UI_UX_REFERENCE.md`)에 따라 Phase 1 항목을 적용하고, 구현 내용을 상세히 문서화한다.  
> **작성일**: 2026-03-03  
> **범위**: 백엔드 최소 변경 + 프론트엔드 Dashboard 컴포넌트 전면 개선.

---

## 1. Phase 1 목표 (요약)

| 항목 | 내용 |
|------|------|
| **KPI 카드** | 아이콘 추가, 수익/비용/이익/AR 색 구분, 호버 시 그림자·약간 상승 |
| **알림** | 연체 인보이스·보험 만료 임박을 "Alerts" 한 블록으로 통합, 아이콘 표시 |
| **Loads by Status** | 버튼 나열 → **상태별 막대(비율)** + 개수·퍼센트, 클릭 시 Order 필터 |
| **Recent Loads** | 리스트 → **테이블**(Load#, Status, Customer, Rate, Created, Actions) |

---

## 2. 백엔드 변경

### 2.1 파일

- `backend/app/api/routes/stats.py`

### 2.2 변경 내용

- **Dashboard API** (`GET /stats/dashboard`)의 `recent_loads` 항목에 **고객명** 추가.
- 로드 조회 시 `joinedload(Load.customer)`로 Customer 관계 로드.
- 응답 필드: 기존 `id`, `load_number`, `status`, `rate`, `created_at` + **`customer_name`** (고객 없으면 `null`).

### 2.3 코드 (요약)

```python
# recent 조회 시 customer 로드
recent = (
    db.query(Load)
    .options(joinedload(Load.customer))
    .order_by(Load.created_at.desc())
    .limit(10)
    .all()
)

# recent_loads 항목에 customer_name 추가
"recent_loads": [
    {
        "id": str(l.id),
        "load_number": l.load_number,
        "status": l.status,
        "rate": float(l.rate or 0),
        "created_at": str(l.created_at) if l.created_at else None,
        "customer_name": l.customer.name if l.customer else None,
    }
    for l in recent
],
```

- **의존성**: 기존 `joinedload` 사용, 모델 관계 변경 없음.

---

## 3. 프론트엔드 변경

### 3.1 파일

- `frontend/src/pages/Dashboard.tsx`

### 3.2 타입

- `DashboardStats.recent_loads[].customer_name?: string | null` 추가.

### 3.3 KPI 카드

- **레이아웃**: 카드 상단에 라벨(uppercase, tracking-wide) + **우측에 SVG 아이콘**.
- **아이콘**  
  - Total Loads: 상자(로드) 아이콘, `text-slate-500`  
  - Revenue: 달러 아이콘, `text-emerald-600`  
  - Cost: 하락 추세 아이콘, `text-rose-600`  
  - Profit: 상승 추세 아이콘, `text-blue-600`  
  - AR Outstanding: 문서 아이콘, `text-amber-600`
- **숫자 색**  
  - Revenue: `text-emerald-700`  
  - Cost: `text-rose-700`  
  - Profit: `text-blue-700`  
  - AR: `text-amber-700`
- **호버**: `hover:shadow-md hover:-translate-y-0.5` + `transition-all duration-200`.
- Total Loads, AR Outstanding 카드는 **Link**로 `/order`, `/account/ar` 이동.

### 3.4 알림 (Alerts)

- **한 블록**: 제목 "Alerts" + 경고 아이콘, 왼쪽 강조 `border-l-4 border-amber-500`, 배경 `bg-amber-50/50`.
- 내부는 **리스트**: 연체 인보이스 한 행, 보험 만료 임박 한 행. 각 행에 제목 + "View AR →" / "View Carriers →" 링크.
- 연체 링크: `/account/ar` (기존 `/invoicing` 대신 Account AR로 통일).

### 3.5 Recent Loads

- **테이블**:  
  - 컬럼: Load #, Status, Customer, Rate (CAD), Created, Actions.  
  - Load #: `Link` to `/order/:id`.  
  - Status: `capitalize` + 작은 뱃지 `bg-gray-100 text-gray-700`.  
  - Customer: `customer_name ?? '–'`.  
  - Created: `toLocaleDateString()`.  
  - Actions: "View" 링크.
- 상단: "Recent Loads" 제목 + "View all orders →" 링크.
- 기존 리스트(`<ul>`) 제거, `table-wrap` + `table-header` 클래스 사용.

### 3.6 Loads by Status

- **구성**: 상태별 한 행씩.  
  - 첫 줄: 상태명(클릭 시 `/order?status=...`) + **개수 (퍼센트)**.  
  - 둘째 줄: **가로 막대** — `maxStatusCount` 대비 비율로 `width` 설정, `bg-gray-100` 트랙 + `bg-slate-400`(호버 시 `bg-blue-500`) 바.
- 정렬: `count` 내림차순.
- 하단: "View all orders →" 링크.

### 3.7 로딩

- 기존 "Loading stats..." 텍스트 → **스피너** + "Loading..." (Tailwind `animate-spin` 원형).

### 3.8 레이아웃

- 최상단 컨테이너: `space-y-6`.
- KPI 그리드: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5` (AR 카드 포함 시 5열).

---

## 4. 수정·추가된 파일 목록

| 파일 | 변경 |
|------|------|
| `backend/app/api/routes/stats.py` | `recent_loads`에 `customer_name` 추가, `joinedload(Load.customer)` |
| `frontend/src/pages/Dashboard.tsx` | Phase 1 전반 반영(카드·알림·테이블·상태 막대·아이콘·호버·로딩 스피너) |

---

## 5. Before / After 요약

| 영역 | Before | After |
|------|--------|--------|
| KPI 카드 | 텍스트만, 단색 | 아이콘 + 수익/비용/이익/AR 색 구분 + 호버 효과 |
| 알림 | 연체·보험 각각 별도 배너 | "Alerts" 한 블록, 리스트 형태 |
| Recent Loads | 단순 `<ul>` 리스트 | 테이블(Load#, Status, Customer, Rate, Created, View) |
| Loads by Status | 버튼 나열 | 상태별 막대 + 개수·퍼센트, 클릭 시 필터 |
| 로딩 | 텍스트 | 스피너 + 텍스트 |

---

## 6. 테스트 체크리스트

- [ ] 로그인 후 Dashboard 진입 시 스피너 후 카드·테이블·상태 막대 표시
- [ ] KPI 카드 호버 시 그림자·약간 상승
- [ ] Total Loads / AR Outstanding 카드 클릭 시 Order·Account AR 이동
- [ ] Alerts가 있을 때만 "Alerts" 블록 표시, 링크 동작
- [ ] Recent Loads 테이블에 Load#, Status, Customer, Rate, Created, View 표시
- [ ] Load # / View 클릭 시 해당 로드 상세 이동
- [ ] Loads by Status 각 행 클릭 시 `/order?status=...` 이동, 막대 비율이 개수에 비례
- [ ] API `recent_loads[].customer_name` 존재 시 Customer 컬럼에 표시, 없으면 "–"

---

## 7. 참고 문서

- `docs/DASHBOARD_UI_UX_REFERENCE.md` — 타사 예시 및 Phase 1·2·3 제안
- `docs/FRONTEND_UI_GUIDE.md` — 프론트 공통 UI·수정 위치

Phase 2(기간 선택, 전 기간 대비 %, 추이 차트)는 백엔드 시계열/비교 API 확장 후 진행한다.

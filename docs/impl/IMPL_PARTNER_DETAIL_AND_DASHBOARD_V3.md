# Implementation: PartnerDetail Tab Restructure + Dashboard Layout V3

**Date:** 2026-03-03  
**Scope:** `freight-broker/frontend/src/pages/PartnerDetail.tsx`, `freight-broker/frontend/src/pages/Dashboard.tsx`  
**Branch/Tag:** 참조 이미지 alignment 3차 (Partner Detail + Dashboard)

---

## 1. 구현 배경

직전 세션까지 완료된 UI 정렬 작업(IMPL_REFERENCE_ALIGNMENT_V2.md)에 이어, 미완료 항목이었던:
1. **PartnerDetail**: Customer 탭 구조(General / Load Setup / Quick View), Carrier 탭 구조(General / Contacts) 재편
2. **Dashboard**: 참조 이미지 기준 2열 레이아웃 재제작

을 이번 세션에서 완료하였다.

---

## 2. PartnerDetail.tsx 변경사항

### 2.1 Partner 타입 확장

기존 타입에 누락된 필드를 추가:

```typescript
credit_limit: number | null
truck_calls: number | null
account_type: string | null
discount_pct: number | null
currency: string | null
expense_terms: string | null
is_active: boolean
```

### 2.2 DetailTab 타입 변경

```typescript
// Before
type DetailTab = 'detail' | 'locations' | 'staff' | ...

// After
type DetailTab = 'general' | 'load_setup' | 'quick_view' | 'locations' | 'staff' | 'contacts' | 'vehicles' | 'teams' | 'services' | 'email_templates' | 'operation_info'
```

### 2.3 Customer General 탭 (CustomerGeneralTab)

- **좌측 컬럼**: Customer Info (Name, Address, Country/Province/City/Postal, Account No, Load Req, Contact Email/Phone)
- **우측 컬럼** (파란 배경 `bg-blue-50`):
  - **Billing** 섹션: Credit Terms, Currency (CAD/USD 드롭다운), Credit Limit, Account Type, Truck Calls, Discount %
  - **Tax** 섹션: Tax Code, Expense Terms

### 2.4 Carrier General 탭 (CarrierGeneralTab)

- **좌측 컬럼**: Carrier Info (Name, Legal Name, Address, Country/Province/City/Postal, MC#, DOT#, Insurance Expiry, Postal Message, Notes, Hazmat/W9 체크박스)
- **우측 컬럼**:
  - **Operation Info** 섹션 (파란 배경): Carrier Type, Operating Status, MC Status, Service Hours, Contact Email/Phone
  - **Payment Info** 섹션 (앰버 배경): Currency, Payment Terms, Payment Days, Payment Type, Factor Company, ACH/EFT, Tax Code

### 2.5 Load Setup 탭 (LoadSetupTab, 고객 전용)

고객의 로드 요구사항 및 설정 입력 폼:
- Default Equipment Type, Billing Ref, MC#, DOT#, Truck Calls, Insurance Expiry, Service Notes

### 2.6 Quick View 탭 (QuickViewTab, 고객 전용)

고객의 최근 20개 로드를 테이블로 표시:
- 컬럼: Load #, Status, Pickup, Delivery, Revenue, Profit
- 링크: "View All →" → `/order?customer_id={id}`
- 데이터 없을 경우 "No loads found" 안내

### 2.7 탭 구조 변경

| 파트너 유형 | 탭 목록 |
|-------------|---------|
| **Customer** | General \| Load Setup \| Quick View \| Locations \| Staff \| Teams \| Services \| Email Templates |
| **Carrier** | General \| Contacts \| Vehicles \| Operation Info \| Teams \| Services \| Email Templates |
| **New (미결정)** | General |

### 2.8 헤더 UI 재구성

```
[← Back] [Customer Detail — {name}]    [Active 토글] [+ New] [Save]
```

- **Active 토글**: 슬라이드 스위치 형태, `is_active` 필드 토글
- **+ New 버튼**: `/partner/new`로 이동
- **Save 버튼**: 파란색 (`bg-blue-600`)
- 탭 활성 표시: 파란색 하단 보더 (`border-blue-600 text-blue-600`)

---

## 3. Dashboard.tsx 변경사항

### 3.1 레이아웃 구조 재편

```
[Header: 제목 + 기간 선택]
[Alerts (조건부)]
[Row 1: KPI 카드 5개 (2-3-5 열 그리드)]
[Row 2: AP Summary (1열) | Recently Dispatched Carriers (2열)]
  └─ AP Summary 하단: Loads by Status 미니 바 차트 (상위 5개)
[Row 3: Profit (Sales) 바 차트 (1열) | Top 10 Customers 테이블 (1열)]
[Row 4: Recent Loads 전체 테이블]
```

### 3.2 KPI 카드 (Row 1)

- 5개 카드: Total Loads / Revenue / Cost / Profit / AR Outstanding (또는 Total AP)
- 금액에 `$` 접두사 추가
- `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` 반응형 그리드

### 3.3 AP Summary + Loads by Status (Row 2 Left)

AP 숫자 (Total AP / Unpaid AP / Overdue Count) + 하단에 상위 5개 status 바 차트

### 3.4 Recently Dispatched Carriers (Row 2 Right)

기존과 동일하나 열 배치를 `lg:col-span-2`로 확장

### 3.5 Profit (Sales) 차트 (Row 3 Left)

- `trend.length > 0`인 경우 바 차트, 없으면 기간 선택 안내 메시지
- 하단에 총 Revenue / Cost / Profit 요약 표시

### 3.6 Top 10 Customers (Row 3 Right)

- 더 컴팩트한 `text-xs` 테이블
- 컬럼: Customer / Balance / Revenue / Cost / Profit / %
- Revenue/Cost/Profit 컬럼에 색상 적용 (에메랄드 / 로즈 / 블루)

---

## 4. 테스트 결과

```
npx tsc --noEmit   → Exit code: 0 (에러 없음)
npm run build      → Exit code: 0 (빌드 성공, 13.19s)
```

---

## 5. 영향 범위

| 파일 | 변경 유형 | 주요 내용 |
|------|-----------|-----------|
| `frontend/src/pages/PartnerDetail.tsx` | 대규모 수정 | 탭 구조, 2열 레이아웃, 신규 탭 컴포넌트 |
| `frontend/src/pages/Dashboard.tsx` | 중규모 수정 | 레이아웃 재편, 2열 구조, 차트 배치 |

---

## 6. 배포 정보

- **로컬 빌드**: `dist/` 생성 완료
- **서버 배포**: `python deploy_to_ubuntu.py` 실행
- **Git**: commit + push + tag 완료

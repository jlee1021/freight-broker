# Clone 대상 참고 솔루션 전체 구현 문서

> **작성일**: 2026-03-03  
> **롤백 태그**: `v1.0-before-clone-impl`  
> **구현 범위**: 갭 분석 문서(`CLONE_REFERENCE_GAP_ANALYSIS.md`) 기반 전체 구현

---

## 롤백 방법

```bash
git checkout v1.0-before-clone-impl
# 또는 특정 파일만
git checkout v1.0-before-clone-impl -- frontend/src/pages/Dashboard.tsx
```

---

## 1. 백엔드 신규 모델 (019 마이그레이션)

### 파일: `backend/app/models/os_osd.py`
- `OsOrder` — OS List (Order Sheet) 모델
  - 필드: `order_code`, `status`, `contract_type`, `customer_id`, `buyer`, `sales_rep`, `customer_po`, `load_date`, `deliver_date`, `product_name`, `qty`, `unit_price`, `currency`, `tax`, `subtotal`, `total`, `invoice_number`, `billing_type`, `memo`, `created_by`
- `OsdRecord` — OSD (Overages, Shortages, Damages) 모델
  - 필드: `ref_number`, `status`, `osd_type`, `amount`, `ar_amount`, `ap_amount`, `customer_id`, `shipper_id`, `carrier_id`, `ship_date`, `delivery_date`, `due_date`, `expired_cargo`, `company_name`, `notes`

### 파일: `backend/app/models/partner_extra.py`
- `PartnerTeam` — 파트너별 팀 멤버십 (Name, Role, Email)
- `PartnerService` — 파트너 서비스 아이템 (Item, Type, Qty, Unit)
- `PartnerEmailTemplate` — 이메일 템플릿 (LoadConfirmation, DriverDisplay 등)
- `CarrierOperationInfo` — 캐리어 운영 정보 (Operation Times, Timezone, Payment, API Works)
- `LocationStaff` — 로케이션별 담당자
- `LocationContact` — 로케이션별 연락처
- `LocationEquipment` — 로케이션별 장비

### 파일: `backend/alembic/versions/019_os_osd_partner_extra.py`
마이그레이션 항목:
- `os_orders` 테이블
- `osd_records` 테이블
- `partner_teams` 테이블
- `partner_services` 테이블
- `partner_email_templates` 테이블
- `carrier_operation_info` 테이블
- `location_staff` 테이블
- `location_contacts` 테이블
- `location_equipment` 테이블
- `partners` 테이블 컬럼 추가: `credit_limit`, `truck_calls`, `account_type`, `discount_pct`, `currency`, `expense_terms`
- `loads` 테이블 컬럼 추가: `waybill_type`, `billing_type`

---

## 2. 백엔드 신규 API 라우트

### `backend/app/api/routes/os_orders.py`
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/os-orders` | OS List 조회 (status, contract_type, date_from/to, q 필터) |
| GET | `/os-orders/{id}` | 단일 OS 주문 조회 |
| POST | `/os-orders` | OS 주문 생성 |
| PATCH | `/os-orders/{id}` | OS 주문 수정 |
| DELETE | `/os-orders/{id}` | OS 주문 삭제 |

### `backend/app/api/routes/osd.py`
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/osd` | OSD 목록 조회 (status, osd_type, date 필터) |
| GET | `/osd/{id}` | 단일 OSD 조회 |
| POST | `/osd` | OSD 생성 |
| PATCH | `/osd/{id}` | OSD 수정 |
| DELETE | `/osd/{id}` | OSD 삭제 |

### `backend/app/api/routes/partner_extra_routes.py`
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET/POST | `/partners/{id}/teams` | 팀 멤버 관리 |
| PATCH/DELETE | `/partners/{id}/teams/{tid}` | 팀 멤버 수정/삭제 |
| GET/POST | `/partners/{id}/services` | 서비스 아이템 관리 |
| PATCH/DELETE | `/partners/{id}/services/{sid}` | 서비스 수정/삭제 |
| GET/POST | `/partners/{id}/email-templates` | 이메일 템플릿 관리 |
| PATCH/DELETE | `/partners/{id}/email-templates/{tid}` | 이메일 템플릿 수정/삭제 |
| GET/PUT | `/partners/{id}/operation-info` | 캐리어 운영 정보 upsert |
| GET/POST | `/partners/locations/{loc_id}/staff` | 로케이션 담당자 관리 |
| GET/POST | `/partners/locations/{loc_id}/contacts` | 로케이션 연락처 관리 |
| GET/POST | `/partners/locations/{loc_id}/equipment` | 로케이션 장비 관리 |

### `backend/app/api/routes/stats.py` (추가 엔드포인트)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/stats/ap-summary` | AP 전체/미지급/건수 요약 |
| GET | `/stats/profit-by-customer` | 고객별 Profit 상세 (date_from/to, customer_id, period) |

---

## 3. 프론트엔드 구현

### 3-1. Dashboard (`frontend/src/pages/Dashboard.tsx`)
- **AP 요약 블록** 추가: `/stats/ap-summary` API 연동
  - Total AP, Unpaid AP (CAD), Unpaid AP Count 카드 3개
  - `/account/ap` 링크 클릭 시 AP List로 이동

### 3-2. Order List (`frontend/src/pages/Order.tsx`)
- **추가 컬럼**: Customer, Dispatcher, Equipment, Weight, Pickup City, Pickup Date, Delivery City, Delivery Date, Profit
- **추가 필터**: P.O/Ref 검색, Apply/Clear 버튼
- **상태 탭 확장**: `good_to_go`, `exception` 상태 추가
- **Status 뱃지**: 색상 코드 적용 (STATUS_COLORS 맵)
- **로딩 스피너** UI 개선

### 3-3. LoadDetail (`frontend/src/pages/LoadDetail.tsx`)
- **Waybill Type** 필드 추가 (Standard/Express/Economy/Custom)
- **Billing Type** 필드 추가 (Per Piece/Per Pound/Per Mile/Flat Rate/Per Pallet)
- **Revenue/Cost/Profit 요약 박스** UI 개선 (배경 카드 형태)

### 3-4. PartnerDetail (`frontend/src/pages/PartnerDetail.tsx`)
- **Teams 탭** 추가: 팀 멤버 CRUD
- **Services 탭** 추가: 서비스 아이템 CRUD (Air freight/FCL/LCL/LTL/Ocean freight 등)
- **Email Templates 탭** 추가: 템플릿 타입별 이메일 설정
- **Operation Info 탭** 추가 (캐리어 전용): 운영 시간, 결제 정보, API Works

### 3-5. Invoicing/AP List (`frontend/src/pages/Invoicing.tsx`)
- **AP 상태 필터 버튼** 추가: All / Unpaid / Paid
- **Status 뱃지**: 색상 코드 적용
- **컬럼 헤더 정렬** 개선 (Invoice #, Load 링크)

### 3-6. Profit (`frontend/src/pages/Profit.tsx`) — 전체 재작성
- **고객 필터** 드롭다운 추가
- **기간 필터** 추가 (All time / Last 30 days / Last 90 days / This month)
- **요약 카드** 3개: Revenue, Cost, Profit
- **상세 테이블**: Load#, Period, Customer, Status, Revenue, Cost, Profit, Margin%
- **Expense Detail 링크** 추가

### 3-7. Permission CRUD 매트릭스 (`frontend/src/pages/Setting.tsx`)
- Resource × Action(read/write/delete/manage) 매트릭스 뷰 추가
- 활성화 상태 ✓ 표시

### 3-8. Consolidation (`frontend/src/pages/Consolidation.tsx`)
- **하단 요약 합계** 추가: 총 Pallet 수, 총 Weight (Shipper/Consignee 각각)

### 3-9. OS List 신규 페이지 (`frontend/src/pages/OsOrder.tsx`)
- CRUD 전체 구현
- 상태 탭: All / Pending / Out Order / On Going / Receiving / Complete
- 날짜 필터, Order Code 검색
- 18개 컬럼 테이블
- Add/Edit 모달

### 3-10. OSD 신규 페이지 (`frontend/src/pages/Osd.tsx`)
- CRUD 전체 구현
- 상태 탭: All / Open / Pending / Closed
- OSD Type 필터 (Overage/Shortage/Damage)
- AR/AP 금액 분리 표시
- Expired Cargo 표시

### 3-11. App.tsx 라우팅
- `/os-orders` → `OsOrderPage`
- `/osd` → `OsdPage`
- 사이드바에 OS List, OSD 메뉴 추가 (Dispatch 하위)

---

## 4. 테스트 체크리스트

- [ ] Dashboard AP 블록 표시 확인
- [ ] OS List CRUD 동작 확인
- [ ] OSD CRUD 동작 확인
- [ ] Partner Teams/Services/EmailTemplates 탭 동작 확인
- [ ] Carrier Operation Info 탭 동작 확인
- [ ] Order List 추가 컬럼 표시 확인
- [ ] Profit 고객/기간 필터 확인
- [ ] AP List Unpaid/Paid 필터 확인
- [ ] Permission CRUD 매트릭스 표시 확인
- [ ] Consolidation 하단 합계 표시 확인
- [ ] LoadDetail Waybill/Billing Type 저장 확인

---

## 5. 배포 절차

```bash
cd C:\Users\jonghun.lee\freight-broker
python deploy_to_ubuntu.py
```

서버에서 마이그레이션이 자동 실행됨:
```bash
cd /home/ubuntu/freight-broker/backend
alembic upgrade head
```

---

## 6. 미구현 항목 (향후 과제)

이하 항목은 복잡도 및 작업량으로 인해 이번 Sprint에서 제외됨:

| 항목 | 이유 |
|------|------|
| Location Staff/Contacts/Equipment 탭 (PartnerDetail) | Location 탭에 추가 필요 — 현재 API 완성, UI 연결 미완 |
| Load Pallet 상세 | 기존 pallet_info JSONB 필드 UI 미구현 |
| Customer Detail: EDI/Load Setup/Quick View 탭 | EDI는 별도 페이지 존재, 나머지 UI 미완 |
| Carrier Detail: Group/History 탭 | 이력 데이터 미존재 |
| Partner Customer List 추가 컬럼 | 현재 Partners 목록 재활용 중 |
| Debit/Credit 필터/컬럼 확장 | Account 페이지 리팩토링 필요 |

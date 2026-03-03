# Reference Solution Alignment – Implementation Log (V2)

**날짜**: 2026-03-03  
**커밋**: `70ddc95`  
**목적**: 참조 솔루션 이미지 기준 UI/UX 정밀 정렬

---

## 1. 변경 파일 요약

| 파일 | 변경 내용 |
|------|-----------|
| `backend/app/models/partner.py` | `credit_limit`, `truck_calls`, `account_type`, `discount_pct`, `currency`, `expense_terms` 필드 추가 |
| `backend/app/schemas/partner.py` | PartnerBase/PartnerUpdate에 신규 필드 추가 |
| `backend/app/api/routes/partners.py` | `?type` / `?q` 쿼리 파라미터 + `/all-locations` `/all-staff` 집계 엔드포인트 추가 |
| `frontend/src/pages/Partner.tsx` | 전면 재작성: Customer/Carrier/Location/Staff 4개 뷰 분리 |
| `frontend/src/pages/Setting.tsx` | Permission 탭 CRUD 매트릭스 완전 재설계 |
| `frontend/src/pages/Invoicing.tsx` | AR/AP 상태 탭 (Overdue/Unpaid/Upcoming/Paid) 전면 재작성 |
| `frontend/src/pages/Consolidation.tsx` | 상태 탭 9개 + 확장형 행 + 하단 요약 row |
| `frontend/src/pages/Osd.tsx` | 컬럼 재정렬 + Search Load 필터 추가 |
| `frontend/src/pages/Profit.tsx` | 날짜 범위 필터 + name 필터 + 요약 footer |
| `frontend/src/App.tsx` | Profit Expense Detail 실제 페이지 구현 + 사이드바 Partner 링크 수정 |

---

## 2. Partner 페이지 개편

### 참조 이미지 기준 컬럼 구성

**Customer / Carrier 리스트**:
| 컬럼 | 설명 |
|------|------|
| Created | 생성일 (yy/mm/dd) |
| Name | 파트너명 (링크) |
| Address | 주소, 도시, 주 |
| Type | account_type 또는 type |
| Truck Calls | truck_calls 수 |
| Payment Terms | 결제 조건 |
| Credit Limit | $XX,XXX 형식 |
| Status | Active (파란 배지) / Inactive |
| Action | Edit / Del |

**Location 리스트** (`/partner?view=location`):
- 전체 파트너의 location 집계: Created, Name, Address, Email, Phone, Partner, Status, Action

**Staff 리스트** (`/partner?view=staff`):
- 전체 파트너의 staff 집계: Created, Name, Department, Email, Phone, Title, Partner, Status, Action

### 라우팅 변경
- 이전: `/partner?type=customer`, `/partner?type=carrier`
- 이후: `/partner?view=customer`, `/partner?view=location`, `/partner?view=carrier`, `/partner?view=staff`

---

## 3. Permission CRUD 매트릭스

### 참조 이미지 기준 설계
- **좌측**: Permission Name (text), Description (textarea)
- **우측**: 모듈별 체크박스 매트릭스 (Read / Edit / Create)

### 모듈 구성
```
• Dispatch:  Order, Consolidation, EDI, OSD
• Partner:   Customer, Location, Carrier, OEF
• Account:   AR, AP, Expense, Debit+Credit, Item+List
• Inventory: List
• Group:     Default, Qty, Permission
```

### 저장 방식
1. 같은 이름의 기존 권한 레코드 삭제
2. 체크된 항목만 새로 생성 (`/master/permissions` POST)

---

## 4. AR/AP 상태 탭

### AR List 탭
| 탭 | 배경색 | 필터 기준 |
|----|--------|-----------|
| All | gray | 전체 |
| Overdue | red | due_date < today AND status != paid |
| Unpaid | lime | status != paid |
| Upcoming | amber | due_date within 7 days |
| Paid | blue | status = paid |

### AP List 탭
| 탭 | 배경색 |
|----|--------|
| All | gray |
| Overdue | red |
| Unpaid | lime |
| Paid | blue |
| Upcoming | amber |

---

## 5. Consolidation 상태 탭 확장

### 이전 (4개) → 이후 (9개)
```
Pending → Unassigned → On Hold → Ready to Load → Dispatch
→ In-transit → Delivered → Invoiced → Cancelled
```

### 추가 기능
- **확장형 행**: 클릭 시 Shipper/Consignee 상세 인라인 표시
- **하단 요약**: Total of N / Total Weight / Total Pallets / Total Items

---

## 6. OSD 컬럼 재정렬

### 참조 이미지 기준 순서
`#` → `Load` → `Date` → `Ref. #` → `Amount` → `Customer` → `Shipper` → `Carrier` → `Expired Cargo` → `Company Name` → `AR` → `AP` → `Due Date` → `Status` → `Action`

---

## 7. Profit 페이지

### 필터 UI 변경
- **이전**: 기간 드롭다운 (Last 30d / 90d / This month)
- **이후**: 날짜 범위 pickers (From / To) + Name 텍스트 필터 + 고객 드롭다운

### 추가 기능
- 우측 실시간 합계 표시: Total Revenue / Cost / Profit
- 하단 테이블 summary footer
- Profit Expense Detail: 독립 페이지로 구현 (필터 + 테이블)

---

## 8. 백엔드 변경

### Partner 모델 신규 필드
```python
credit_limit = Column(Integer, nullable=True)
truck_calls = Column(Integer, nullable=True)
account_type = Column(String(50), nullable=True)
discount_pct = Column(Integer, nullable=True)
currency = Column(String(10), nullable=True)
expense_terms = Column(String(100), nullable=True)
```
> 이 필드들은 Alembic Migration 019에서 DB에 이미 추가됨 — Python 모델/스키마만 동기화

### Partners 라우터 신규 엔드포인트
```
GET /partners?type=customer&q=ABC
GET /partners/all-locations?q=ABC
GET /partners/all-staff?q=ABC
```

---

## 9. 테스트 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 오류 없음 |
| `npm run build` | ✅ 빌드 성공 |
| 서버 배포 (deploy_to_ubuntu.py) | ✅ 완료 |
| Git push | ✅ main branch push 완료 |

---

## 10. 배포 정보

- **서버**: `http://192.168.111.137:5173` (Frontend), `http://192.168.111.137:8000` (Backend)
- **Git Tag**: commit `70ddc95` on `main`
- **롤백**: `git revert 70ddc95` 또는 이전 태그 `v1.0-before-clone-impl` 사용

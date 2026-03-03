# 참조 솔루션 vs FreightBroker Pro 비교 분석

> **목적**: 첨부 이미지로 확인한 기존 솔루션(KTX/밴쿠버 사용)의 기능·데이터 구조와 현재 FreightBroker Pro를 비교하여, clone 시 추가·변경이 필요한 부분을 정리한다.  
> **작성일**: 2026-03-03  
> **비고**: 이미지에서 빨간/검은색으로 가려진 부분은 민감 정보로 제외하고, UI·필드명·기능만 기준으로 분석함.

---

## 1. 비교 개요

| 구분 | 참조 솔루션 (이미지 기준) | FreightBroker Pro (현재) |
|------|---------------------------|--------------------------|
| 화물(로드) | 단일 로드 + **통합 로드(Consolidation)** | 단일 로드만 (Shipper/Consignee/Carrier 구간) |
| EDI | **Dispatch EDI** (트랜잭션 타입·TID·TSI·발송 이력) | 없음 (ROADMAP Phase 4) |
| 파트너 | Customer / Carrier / **Location** / **Staff** | Customer / Carrier (단일 주소·연락처) |
| 회계·정산 | **AR/AP** + **Expense** + **Debit/Credit** + **Item Type** | AR/AP만 (로드·캐리어 구간 연동) |
| 재고 | **Item#**, Name, Size, Qty, Cost, Total, Entry Date, Note | Warehouse + SKU, name, quantity |
| 설정·마스터 | **City**(Code/Province/Country/Timezone), **Type/SubType**, **Permission** | 회사 브랜딩, 기본 Tax/FSC/장비 유형 |
| 캐리어 상세 | **Detail/History** 탭, 연락처·차량·DOT LOOK UP·결제일·W9·Hazmat | MC/DOT/보험만료일, payment_terms |

---

## 2. 모듈별 상세 비교

### 2.1 Dispatch / Order (화물·배차)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 주문(로드) 목록 | Order 목록 + 검색·필터 | Order(로드) 목록, 상태/고객/날짜 필터 | 유사 |
| 로드 추가 | Order Add (Customer, Bill To, Order Date, Order ID, Freight ID 등) | New Load (Load#, Status, Customer, Rate, FSC, Tax, Equipment 등) | 참조는 주문·청구 ID 등 필드 더 많음 |
| Shipper/Consignee | 다중 Stop, 주소·Due Date·Appointment·By Time·팔레트(Total Pallet, Temperature, Gross Value, Cubic, Weight, Width, Length, Height, Images, Contact) | ShipperStop/ConsigneeStop (name, address, city, province, pickup_date, time_start/end, type, pallet_info JSON, notes) | 참조는 팔레트·이미지·Contact 구조화 수준 높음 |
| Carrier 구간 | Carrier, Carrier Invoice, Invoice Date, Load Status, Assigned, Amount Charged, Tax, Total, View Carrier Charged, Equipment, Stop Type, BOL Date, Arrival Date/Time, P/U Date/Time, Seal/Tags | CarrierSegment (carrier, rate, fsc, tax_code, total, carrier_invoice_number, invoice_date, lc_number, load_status, rating, on_time) | 참조는 장비·Stop Type·도착/픽업 시간·Seal 등 필드 추가 |
| Reference | Reference, Reference Type, Special Instructions, Bill of Lading 체크, Internal Note | Reference (reference_number, reference_type, special_instructions, internal_notes) | 거의 동일, 참조는 BOL 체크박스 |
| 사용자·감사 | User, Created By, Last Modified By | dispatcher_id, sales_rep_id, billing_rep_id (담당자만) | 참조는 생성/수정자 감사 필드 명시 |

**요약**: 단일 로드 흐름은 비슷하나, 참조는 **팔레트·이미지·시간·장비·감사** 필드가 더 세분화되어 있음.

---

### 2.2 Consolidation (통합 로드)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 통합 로드 | **Consolidation Active Load - New** (Shipper 1/2, Consignee 1, 다중 구간·색상 구분) | **없음** | 참조만 다중 화주/수화인을 하나의 “통합 로드”로 묶어 관리 |
| 구조 | Customer, Bill To, Order Date, Order ID, Freight ID, Active/Hold, Type, Status, Load ID, Ref Number | — | 단일 로드만 있음 |
| 테이블 | Customer / Shipper Carrier / Consignee Carrier 테이블 | — | 통합 로드 내 고객·캐리어 매핑 테이블 없음 |

**요약**: **LTL 통합·복수 출발지/도착지** 시나리오는 현재 솔루션에 없음. Clone 시 “Consolidation” 엔티티 및 화면 신규 필요.

---

### 2.3 EDI (Electronic Data Interchange)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| EDI 설정 | **Dispatch_EDI** (Type, Name, Type, Mode, TID, TSI, Remarks, Status) CRUD | 없음 | EDI 트랜잭션 타입·설정 관리 없음 |
| EDI 목록 | **Dispatch EDI List** (Company, Date, Report Type 필터 / Client, Inv#, BoL#, P.O#, Trk#, Ap Date, Sent By, Sent At, Status, T.P#, T.P Name) | 없음 | EDI 문서·발송 이력 목록 없음 |

**요약**: **EDI 204/210/214/990/997** 등 문서 발송·추적 기능은 현재 없고, ROADMAP Phase 4 “EDI/B2B 연동”에 해당. Clone 시 EDI 설정·EDI List 화면 및 스키마 추가 필요.

---

### 2.4 Partner (파트너 관리)

#### 2.4.1 Customer / Carrier 공통

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 고객 목록 | Customer 목록 (필터·검색·+ Add) | Partner (type=customer) 목록 | 유사 |
| 캐리어 목록 | **CARRIER** (CODE, NAME, DATE CREATED, POSTAL CODE, PHONE NO, ACTIVE, ACTION) | Partner (type=carrier), MC/DOT/보험만료일 | 참조는 CODE·ACTIVE·생성일 명시 |
| 캐리어 상세 | **Carrier Detail** (Detail/History 탭) | PartnerDetail (단일 폼) | 참조는 History 탭·이력 관리 |
| 캐리어 필드 | Carrier Name, Address, Country, State/Province, City, Zip, Phone, Personal Message | name, contact_email, contact_phone, address, city, province, country, postal_code, notes | 유사 |
| 캐리어 규제 | **DOT# (LOOK UP)**, Legal Name, Operating Status, Carrier Type, Main Contact Email, Default Tax Code, Service Hours, **MC Status**, **Hazmat Carrier**, **W9 Received** | mc_number, dot_number, insurance_expiry, payment_terms | 참조는 DOT 조회·법적명·운영상태·세금코드·W9·Hazmat 등 |
| 캐리어 결제 | **Payment Terms, Payment Days, Payment Type, ACH/EFT Banking, Factor Co. Name** | payment_terms (텍스트) | 참조는 결제일·결제유형·ACH·팩터링 |
| 연락처·차량 | **Contacts** (Name, Department, Email), **Vehicles** (Type, Number, Model, Price) | 없음 (파트너당 단일 contact) | 참조는 1:N 연락처·차량 |

#### 2.4.2 Location (위치)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 위치 목록 | **Locations** (Created, Name, Address, City, State, Zip, Contact Info, Memo, Edit, Delete), Active 필터 | Partner는 단일 주소만; **Location** 테이블 존재하나 로드의 Stop용이 아닌 별도 용도로만 사용 가능 | 참조는 “위치”를 독립 엔티티로 CRUD |
| 위치 추가 | **Partner Location Add** (Location: Name, Address, Tel, City/State/Zip, Entry Date, Notes / Customer: Customer Name, Bill, Description, Billing/Ship To, Comments) | Partner + 주소 필드 | 참조는 파트너별 **다중 Location** + 청구/배송지·Bill |

**요약**: 참조는 **캐리어 연락처·차량·DOT LOOK UP·결제 상세·W9·Hazmat·Location(다중)** 이 있음. 현재는 파트너당 단일 연락처·단일 주소.

#### 2.4.3 Staff (스태프)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 스태프 | **Partner Staff** 목록·**Staff Add** (파트너 소속 직원) | 없음 (User는 시스템 로그인 계정만) | 참조는 “파트너 소속 담당자” 개념 |

**요약**: 고객/캐리어별 **담당자(Staff)** 관리 기능은 현재 없음. Clone 시 Partner : Staff 1:N 모델·화면 검토 필요.

---

### 2.5 Account (회계·정산)

#### 2.5.1 AR / AP 목록

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| AR 목록 | **Account AR List** (이미지 추정: Inv#, 고객, 금액, 상태 등) | Invoicing > AR (invoice_number, load, customer, amount, status, due_date, Mark Sent/Paid) | 유사 |
| AP 목록 | **Account AP List** (이미지 추정: 캐리어, 금액, 상태 등) | Invoicing > AP (carrier_segment, amount, status, Mark Paid) | 유사 |

#### 2.5.2 Expense (경비)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 경비 추가 | **Add Expense** (Item Type, Ref No., Bill To, PO No., Memo, Date, Amount, Tax Amount, Account, Vendor) | **없음** | 로드/캐리어 외 **일반 경비** 입력 없음 |
| 경비 상세 | **Expense Detail** (General Account, Entry Type 필터 / Entry #, Status, Accountability, Vendor) | 없음 | 경비 목록·필터·상태·공급업체 추적 없음 |

**요약**: **운영 경비(유류·통행료·수리 등)** 를 Item Type·Account·Vendor로 기록·조회하는 모듈이 없음. Clone 시 Expense 엔티티·화면 추가 필요.

#### 2.5.3 Debit/Credit (차변/대변)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 차대변 | **ADD DEBIT CREDIT** (Type, Reason, Debit Amount, Credit Amount, Customer Code, Tax#, Email, Note/Attach/Share 탭) | 없음 | **회계 분개(차변/대변)** 기능 없음 |

**요약**: AR/AP 이외의 **수동 분개·조정** 기능 없음. Clone 시 Debit/Credit 또는 Journal 엔티티 검토.

#### 2.5.4 Item Type (항목 유형)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 항목 유형 | **Item Type List** (Item Type, Code, Type Name, Lvl 1, Lvl 2, Dividers, UOM, RC, Rebate, Status), Account Type 필터 | 없음 | **경비/품목 분류용 마스터** 없음 |

**요약**: 경비·품목의 **유형/계층(UOM, RC, Rebate)** 마스터가 없음. Clone 시 ItemType(또는 ExpenseType) 테이블·화면 필요.

---

### 2.6 Profit (이익·비용 분석)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 이익 요약 | Profit (추정: Revenue/Cost/Profit) | Profit (Total Revenue, Cost, Profit) | 유사 |
| 고객별 | **Profit Customer** (고객별 수익/비용 추정) | Reports > Revenue (group_by=customer) | 유사 |
| 비용 상세 | **Expense Detail** (General Account, Entry Type → Entry #, Status, Accountability, Vendor) | 없음 | **비용 상세·계정별·Vendor별** 뷰 없음 |

**요약**: 이익 집계는 비슷하나, 참조의 **Expense Detail** 수준의 비용 상세·계정·Vendor 연결은 없음.

---

### 2.7 Inventory (재고)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 목록 | **Inventory** (Item#, Name, Size, Qty, Cost, Total, Entry Date, Note), Search, From/To Date | Inventory (Warehouse별 탭, SKU, name, quantity) | 참조는 **Size, Cost, Total, Entry Date, Note**, 날짜 필터 |
| 구조 | 항목 단위 (Item# 기준) | Warehouse → InventoryItem (sku, name, quantity) | 참조는 단가·총계·비고·날짜 필드 있음 |

**요약**: 재고 “수량” 관리 개념은 같으나, 참조는 **Size, Cost, Total, Entry Date, Note** 등 재고 가치·이력 필드가 더 있음.

---

### 2.8 Settings / 마스터 데이터

#### 2.8.1 City (도시)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 도시 목록 | **City** (Code, City, Province, Country, Edit, Delete), Search, + Add | 없음 (Shipper/Consignee에 city 텍스트 입력) | **도시 마스터** 없음 |
| 도시 추가 | **Add City** (City, Zip Code, Remarks, **Timezone**, Country) | — | 참조는 **Timezone** 포함 |

**요약**: **도시 마스터(Code, Province, Country, Timezone)** 가 없어, Clone 시 City 테이블·CRUD·Timezone 반영 검토 필요.

#### 2.8.2 Type / SubType (유형)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 유형 추가 | **Add New Type** (Type Name, **Use SubType**, SubType Name, Description, Remark, Status) | Setting의 default_equipment_types 등 키/값만 | **계층 유형(Type/SubType)** 마스터 없음 |

**요약**: 품목·경비·장비 등 **분류용 Type/SubType** 마스터가 없음. Clone 시 Type·SubType 테이블·UI 필요.

#### 2.8.3 Permission (권한)

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 권한 목록 | **Permission List** (Permission Name, Created, Edit, Delete), + Add | User의 **role** (admin/dispatcher/sales/billing) 고정값만 | **권한을 엔티티로 CRUD** 하지 않음 |
| 권한 추가 | **Permission Add** (추정: 권한명·리소스·동작) | — | 역할별 메뉴 접근은 코드로만 제어 |

**요약**: **권한을 DB에서 생성/수정**하는 설정이 없음. Clone 시 Permission(및 Role-Permission) 모델·설정 화면 검토.

#### 2.8.4 Default 설정

| 항목 | 참조 솔루션 | FreightBroker Pro | 차이 |
|------|-------------|-------------------|------|
| 기본값 | **Setting_Default** (이미지 추정: 세금·FSC·기본값 등) | Settings (company_name, logo, address, default_tax_code, default_fsc_percent, default_equipment_types, SMTP, AR reminder) | 유사 |

---

## 3. 데이터 구조 차이 요약

### 3.1 참조 솔루션에만 있는(또는 더 세분화된) 엔티티·필드

| 영역 | 참조 솔루션 | 비고 |
|------|-------------|------|
| Dispatch | Consolidation, ConsolidationSegment(추정) | 통합 로드 |
| EDI | EDI 설정 테이블, EDI List(Client, Inv#, BoL#, P.O#, Trk#, Sent By, Sent At, T.P# 등) | EDI 문서·발송 이력 |
| Partner | Location(다중), Staff, Carrier Contacts, Carrier Vehicles | 파트너별 위치·담당자·연락처·차량 |
| Carrier | Legal Name, Operating Status, Default Tax Code, Service Hours, MC Status, Hazmat, W9, Payment Days, Payment Type, ACH/EFT, Factor Co. | 규제·결제 상세 |
| Account | Expense, DebitCredit(Journal), ItemType(마스터) | 경비·차대변·항목유형 |
| Profit | Expense Detail 뷰(계정·Vendor·Status) | 비용 상세 |
| Inventory | Size, Cost, Total, Entry Date, Note, 날짜 필터 | 재고 가치·이력 |
| Settings | City(Code, Province, Country, Timezone), Type/SubType, Permission CRUD | 도시·유형·권한 마스터 |

### 3.2 FreightBroker Pro에만 있는(또는 더 발달한) 부분

| 영역 | FreightBroker Pro | 비고 |
|------|-------------------|------|
| 로드 | Tender 워크플로우(이메일·토큰 수락/거절), Load Note | 캐리어 견적 요청·내부 노트 |
| AR | 리마인더 자동화(APScheduler, 기준일/반복일), Last Reminder 컬럼 | 연체 자동 알림 |
| 문서 | LC, Rate Confirmation, BOL, Pallet Tag, Customer Invoice, Carrier Payable PDF/이메일 | 문서 생성·발송 |
| 포털 | 고객/캐리어 포털, PortalDashboard, 데이터 격리 | 외부 사용자 전용 UI |
| 인증 | JWT, role 기반 메뉴 제한 | 로그인·역할 |

---

## 4. Clone 시 우선순위 제안 (기능 갭 기준)

- **높음 (업무 핵심)**  
  - Consolidation(통합 로드)  
  - Partner Location(다중) + Partner Staff  
  - Expense(경비) + Expense Detail  
  - City 마스터(Code, Province, Country, Timezone)  
  - Carrier 확장(DOT LOOK UP, W9, Hazmat, Payment Days/Type, ACH/EFT, Factor, 연락처·차량)

- **중간 (운영·보고)**  
  - Item Type(마스터) + Account Type  
  - Debit/Credit(분개)  
  - Permission CRUD  
  - Type/SubType 마스터  
  - Inventory 확장(Size, Cost, Total, Entry Date, Note, 날짜 필터)

- **낮음 (단기 제외 가능)**  
  - EDI 설정·EDI List (Phase 4로 연동 시 함께 설계)  
  - 로드 폼 세부 필드(팔레트 상세·이미지·Seal/Tags 등)는 단계적으로 추가

---

## 5. 정리

- **공통으로 이미 갖춘 것**: 단일 로드 CRUD, Shipper/Consignee/Carrier 구간, AR/AP, 파트너(Customer/Carrier) 기본 정보, 대시보드·리포트·재고 기본·시스템 설정(브랜딩·기본값·SMTP), 포털, Tender, 문서 생성·이메일.
- **참조에 있고 우리에 없는 것**: Consolidation, EDI, 파트너 Location/Staff, 캐리어 연락처·차량·규제/결제 상세, Expense·Debit/Credit·Item Type, 도시·Type/SubType·Permission 마스터, 재고 Cost/Total/Note/날짜, 비용 상세(Expense Detail) 뷰.
- **우리만 강화된 것**: Tender 워크플로우, AR 리마인더 자동화, 문서 PDF/이메일, 고객/캐리어 포털 전용 UI.

이 문서를 기준으로 clone 범위(우선순위·Phase)를 정한 뒤, 필요한 모듈부터 스키마·API·화면을 추가하면 된다.

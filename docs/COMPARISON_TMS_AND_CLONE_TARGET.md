# TMS·참조 솔루션·우리 솔루션 3자 비교

> **목적**: (1) 시장의 다른 Freight Broker/TMS 솔루션, (2) **clone 대상 참조 솔루션**, (3) 현재 **FreightBroker Pro** 를 한눈에 비교하고, **참조 솔루션의 기능·데이터는 전부 clone** 해야 함을 기준으로 갭을 정리한다.  
> **작성일**: 2026-03-03  
> **관련 문서**: `COMPARISON_REFERENCE_SOLUTION.md` (참조 vs 우리 상세), `ROADMAP.md` (시장 조사·Phase)

---

## 1. 비교 대상 정리

| 구분 | 설명 | 역할 |
|------|------|------|
| **시장 TMS** | ARK TMS, Rose Rocket, Ascend TMS, BrokerPro 등 상용/경쟁 TMS | 업계 표준·추가 검토용 참고 |
| **참조 솔루션** | 이미지로 확인한 KTX/밴쿠버 사용 솔루션 | **clone 대상 — 기능·데이터 전부 우리 쪽으로 이식** |
| **우리 솔루션** | FreightBroker Pro (현재 코드베이스) | 참조 기능을 채워 넣을 베이스 |

**원칙**: 참조 솔루션에 있는 기능·화면·데이터 구조는 **우리가 다 clone** 해야 한다. 시장 TMS는 “참조에 없는데 시장에는 있는 것”을 보여 주어, clone 이후 검토용으로만 사용한다.

---

## 2. 기능 축별 3자 비교 (요약)

### 2.1 배차·로드·문서

| 기능 | 시장 TMS (ARK 등) | 참조 솔루션 (clone 대상) | 우리 솔루션 | 비고 |
|------|:----------------:|:------------------------:|:----------:|------|
| 로드 CRUD·상태 관리 | ✅ | ✅ | ✅ | 참조·우리 동일 방향 |
| 단일 로드 + Shipper/Consignee/Carrier 구간 | ✅ | ✅ | ✅ | |
| **통합 로드(Consolidation)** | ✅ (LTL 등) | ✅ | ❌ | **clone 필요** |
| 로드별 문서(LC, RC, BOL, Pallet Tag) | ✅ | ✅ (추정) | ✅ | |
| 문서 PDF·이메일 발송 | ✅ | ✅ (추정) | ✅ | |
| 팔레트 상세·이미지·Seal/Tags·Created/Modified By | ✅/🔶 | ✅ | ❌ | **clone 시 로드 폼 확장** |
| **EDI 설정·EDI List(발송 이력)** | 🔶/✅ | ✅ | ❌ | **clone 필요** |

### 2.2 파트너·캐리어

| 기능 | 시장 TMS | 참조 솔루션 (clone 대상) | 우리 솔루션 | 비고 |
|------|:--------:|:------------------------:|:----------:|------|
| Customer/Carrier 기본 CRUD | ✅ | ✅ | ✅ | |
| **파트너별 다중 Location** | ✅ | ✅ | ❌ | **clone 필요** |
| **파트너 소속 Staff(담당자)** | ✅ | ✅ | ❌ | **clone 필요** |
| 캐리어 연락처 1:N, 차량 1:N | ✅ | ✅ | ❌ | **clone 필요** |
| DOT# LOOK UP, Legal Name, Operating Status | ✅ | ✅ | ❌ | **clone 필요** |
| MC Status, Hazmat, W9, Service Hours, Default Tax Code | ✅ | ✅ | ❌ | **clone 필요** |
| Payment Days, Payment Type, ACH/EFT, Factor Co. | ✅ | ✅ | ❌ | **clone 필요** |
| 캐리어 Detail/History 탭(이력) | ✅ | ✅ | ❌ | **clone 필요** |
| MC/DOT/보험만료일 | ✅ | ✅ | ✅ | |

### 2.3 회계·정산·경비

| 기능 | 시장 TMS | 참조 솔루션 (clone 대상) | 우리 솔루션 | 비고 |
|------|:--------:|:------------------------:|:----------:|------|
| AR(고객 인보이스)·AP(캐리어 지급) | ✅ | ✅ | ✅ | |
| **Expense(경비)** 입력·목록·상세 | ✅ | ✅ | ❌ | **clone 필요** |
| **Expense Detail** (계정·Entry Type·Vendor·Status) | ✅ | ✅ | ❌ | **clone 필요** |
| **Debit/Credit(차대변·분개)** | ✅ | ✅ | ❌ | **clone 필요** |
| **Item Type 마스터** (경비/품목 분류) | ✅ | ✅ | ❌ | **clone 필요** |
| AR 리마인더 자동화 | ✅ | 🔶 (추정) | ✅ | 우리가 이미 보유 |

### 2.4 재고·이익·보고

| 기능 | 시장 TMS | 참조 솔루션 (clone 대상) | 우리 솔루션 | 비고 |
|------|:--------:|:------------------------:|:----------:|------|
| 재고(창고·항목) 기본 | ✅ | ✅ | ✅ | |
| **재고: Size, Cost, Total, Entry Date, Note, 날짜 필터** | ✅ | ✅ | ❌ | **clone 필요** |
| 이익 요약·고객/캐리어/레인 리포트 | ✅ | ✅ | ✅ | |
| **Expense Detail 기반 비용 분석** | ✅ | ✅ | ❌ | **clone 필요** |

### 2.5 설정·마스터·권한

| 기능 | 시장 TMS | 참조 솔루션 (clone 대상) | 우리 솔루션 | 비고 |
|------|:--------:|:------------------------:|:----------:|------|
| 회사 브랜딩·기본 Tax/FSC/장비 | ✅ | ✅ | ✅ | |
| **City 마스터** (Code, Province, Country, Timezone) | ✅ | ✅ | ❌ | **clone 필요** |
| **Type/SubType** (계층 유형 마스터) | ✅ | ✅ | ❌ | **clone 필요** |
| **Permission CRUD** (권한 엔티티 관리) | ✅ | ✅ | ❌ (role 고정) | **clone 필요** |
| 역할 기반 메뉴 제한 | ✅ | ✅ | ✅ | |

### 2.6 포털·부가 기능 (시장 vs 우리)

| 기능 | 시장 TMS | 참조 솔루션 | 우리 솔루션 | 비고 |
|------|:--------:|:-----------:|:----------:|------|
| 고객/캐리어 포털 | ✅ | 🔶 (추정) | ✅ | 우리가 이미 보유 |
| Tender 워크플로우(이메일·수락/거절) | ✅ | 🔶 (추정) | ✅ | 우리가 이미 보유 |
| QuickBooks 연동 | ✅ | ? | ❌ | clone 범위 외, 추후 검토 |
| 실시간 알림 | ✅ | ? | ❌ | clone 범위 외 |
| 로드보드(DAT) 연동 | ✅/🔶 | ? | ❌ | clone 범위 외 |
| 실시간 트래킹 | ✅/🔶 | ? | ❌ | clone 범위 외 |
| 전자 서명 | 🔶/✅ | ? | ❌ | clone 범위 외 |

---

## 3. 참조 솔루션 Clone 체크리스트 (전부 이식 대상)

아래는 **참조 솔루션에 있고 우리에 없는 것**으로, clone 시 **기능·데이터 구조 전부** 반영해야 하는 항목이다. (이미 우리가 갖춘 AR/AP 기본, 로드 기본, 파트너 기본, 문서 생성 등은 제외.)

### 3.1 Dispatch·Order

- [ ] **Consolidation** (통합 로드): 다중 Shipper/Consignee를 하나의 통합 로드로 묶는 엔티티·화면·테이블(Customer/Shipper Carrier/Consignee Carrier)
- [ ] Order Add 확장: Bill To, Order Date, Order ID, Freight ID, Active/Hold, Type, Ref Number 등
- [ ] Shipper/Consignee 확장: 팔레트(Total Pallet, Temperature, Gross Value, Cubic, Weight, Width/Length/Height), Images, Contact, Appointment, By Time
- [ ] Carrier 구간 확장: Equipment, Stop Type, BOL Date, Arrival Date/Time, P/U Date/Time, Seal/Tags, View Carrier Charged
- [ ] Reference: Bill of Lading 체크박스
- [ ] 감사: Created By, Last Modified By

### 3.2 EDI

- [ ] **Dispatch EDI** (설정): Type, Name, Mode, TID, TSI, Remarks, Status CRUD
- [ ] **Dispatch EDI List**: Company, Date, Report Type 필터 / Client, Inv#, BoL#, P.O#, Trk#, Ap Date, Sent By, Sent At, Status, T.P#, T.P Name

### 3.3 Partner

- [ ] **Location** (다중): 파트너별 Location CRUD — Name, Address, Tel, City/State/Zip, Entry Date, Notes; Customer 쪽 Bill, Description, Billing/Ship To, Comments
- [ ] **Locations** 목록: Created, Name, Address, City, State, Zip, Contact Info, Memo, Active 필터, Edit/Delete
- [ ] **Staff**: Partner Staff 목록·Staff Add (파트너 소속 담당자)
- [ ] **Carrier Detail** 확장: Detail/History 탭
- [ ] 캐리어 **Contacts** (Name, Department, Email) 1:N
- [ ] 캐리어 **Vehicles** (Type, Number, Model, Price) 1:N
- [ ] 캐리어: DOT# LOOK UP, Legal Name, Operating Status, Carrier Type, Main Contact Email, Default Tax Code, Service Hours, MC Status, Hazmat Carrier, W9 Received
- [ ] 캐리어: Payment Terms, Payment Days, Payment Type, ACH/EFT Banking, Factor Co. Name
- [ ] 캐리어 목록: CODE, NAME, DATE CREATED, POSTAL CODE, PHONE NO, ACTIVE, ACTION

### 3.4 Account

- [ ] **Expense**: Add Expense (Item Type, Ref No., Bill To, PO No., Memo, Date, Amount, Tax Amount, Account, Vendor)
- [ ] **Expense Detail**: General Account, Entry Type 필터 / Entry #, Status, Accountability, Vendor
- [ ] **Debit/Credit**: Type, Reason, Debit Amount, Credit Amount, Customer Code, Tax#, Email, Note/Attach/Share 탭
- [ ] **Item Type List**: Item Type, Code, Type Name, Lvl 1, Lvl 2, Dividers, UOM, RC, Rebate, Status, Account Type 필터, CRUD

### 3.5 Profit

- [ ] **Expense Detail** 연동 뷰 (계정·Vendor·Status 기반 비용 상세)

### 3.6 Inventory

- [ ] **Inventory** 확장: Item#, Name, **Size**, Qty, **Cost**, **Total**, **Entry Date**, **Note**, Search, **From/To Date** 필터

### 3.7 Settings·마스터

- [ ] **City**: Code, City, Province, Country, Edit/Delete, Search, + Add
- [ ] **Add City**: City, Zip Code, Remarks, **Timezone**, Country
- [ ] **Type/SubType**: Add New Type (Type Name, Use SubType, SubType Name, Description, Remark, Status)
- [ ] **Permission List**: Permission Name, Created, Edit, Delete, + Add
- [ ] **Permission Add** (권한 엔티티 CRUD)

---

## 4. 시장 TMS vs 참조 솔루션 vs 우리 (표 요약)

| 영역 | 시장 TMS | 참조 (clone 대상) | 우리 | clone 시 조치 |
|------|:--------:|:-----------------:|:----:|---------------|
| 통합 로드(Consolidation) | ✅ | ✅ | ❌ | 참조 기능 전부 clone |
| EDI 설정·List | ✅/🔶 | ✅ | ❌ | 참조 기능 전부 clone |
| 파트너 Location/Staff | ✅ | ✅ | ❌ | 참조 기능 전부 clone |
| 캐리어 연락처·차량·규제·결제 상세 | ✅ | ✅ | 🔶(기본만) | 참조 수준으로 확장 clone |
| Expense·Expense Detail | ✅ | ✅ | ❌ | 참조 기능 전부 clone |
| Debit/Credit·Item Type | ✅ | ✅ | ❌ | 참조 기능 전부 clone |
| City·Type/SubType·Permission 마스터 | ✅ | ✅ | ❌ | 참조 기능 전부 clone |
| 재고 Cost/Total/Note/날짜 | ✅ | ✅ | ❌ | 참조 수준으로 확장 clone |
| 로드 팔레트·이미지·감사 | ✅ | ✅ | ❌ | 참조 수준으로 필드·화면 확장 |
| AR/AP 기본·문서·포털·Tender | ✅ | ✅ | ✅ | 유지 (참조에 없는 부분은 우리 강점) |
| QuickBooks·알림·로드보드·트래킹·전자서명 | ✅/🔶 | ? | ❌ | 참조에 없으면 clone 범위 외, 추후 검토 |

---

## 5. 정리

- **Clone 범위**: 참조 솔루션에 있는 **기능·화면·데이터 구조는 전부** 우리 쪽에 이식해야 한다. 위 **§3 Clone 체크리스트**가 그 목록이다.
- **시장 TMS**: ARK TMS, Rose Rocket 등은 “업계 표준” 참고용이다. 참조에 없는 기능(QuickBooks, 실시간 알림, DAT, 트래킹, 전자 서명 등)은 clone 완료 후 필요 시 단계적으로 검토하면 된다.
- **우리 강점 유지**: Tender 워크플로우, AR 리마인더, 문서 PDF/이메일, 고객/캐리어 포털 전용 UI는 그대로 두고, 참조 기능을 **추가**하는 형태로 clone 하면 된다.

상세 필드·API·스키마는 `COMPARISON_REFERENCE_SOLUTION.md` 를 참고하고, 구현 순서는 같은 문서의 “Clone 시 우선순위 제안”을 따른다.

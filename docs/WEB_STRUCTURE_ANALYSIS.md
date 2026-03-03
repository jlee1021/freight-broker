# 웹 구조 분석: 참조 솔루션(Clone 대상) vs 현재 FreightBroker Pro

> **목적**: 사진으로 확인한 참조 솔루션(KTX/밴쿠버)의 **UI·네비게이션·정보 구조**와 현재 우리 웹을 비교하고, “최선의 구조” 관점에서 갭과 개선 방향을 정리한다.  
> **작성일**: 2026-03-03  
> **참고**: 기능·데이터 비교는 `COMPARISON_REFERENCE_SOLUTION.md`, `COMPARISON_TMS_AND_CLONE_TARGET.md` 참고.  
**업데이트**: 참조 스크린샷 기준 계층형 사이드바 반영 완료(2026-03-03).

---

## 0. 참조 솔루션 사이드바 구조 (스크린샷 기준)

참조 솔루션은 **계층형·접이식** 사이드바를 사용하며, 각 상위 메뉴에 **아이콘 + 드롭다운 화살표**가 있다.

| 상위 메뉴 | 하위 메뉴 | 비고 |
|-----------|-----------|------|
| **Dispatch** | Order, Consolidation, OSD, EDI | 배차·주문·통합·OSD·EDI 일괄 그룹 |
| **Partner** | Customer, Location, Carrier, Staff | 고객/위치/캐리어/스태프 |
| **Profit** | Customer, Expense Detail | 이익 요약·비용 상세 |
| **Account** | AR List, AP List, Expense, Debit / Credit, Item Type List | 회계 통합 |
| **Inventory** | List | 재고 목록 |
| **Setting** | Default, City, Permission (및 Type) | 기본값·도시·권한·유형 |

**적용 완료**: 현재 FreightBroker Pro 사이드바를 위 구조에 맞춰 **Dispatch / Partner / Profit / Account / Inventory / Setting** 계층으로 변경했고, Account 하위에 AR List·AP List·Expense·Debit/Credit·Item Type List를 두었으며, Setting 하위에 Default·City·Type·Permission 링크를 두었다. (OSD는 Reports로 연결.)

---

## 1. 현재 우리 웹 구조 요약

### 1.1 네비게이션 (사이드바)

| 순서 | 메뉴 | 경로 | 접근 | 비고 |
|------|------|------|------|------|
| 1 | Dashboard | `/` | 전체 | 대시보드 통계 |
| 2 | Orders | `/order` | 내부 | 로드 목록 + 상태 탭 |
| 3 | Partners | `/partner` | 내부 | Customer/Carrier 통합, 타입 필터 |
| 4 | Profit | `/profit` | 내부 | 이익 요약 |
| 5 | Invoicing | `/invoicing` | 내부 | AR + AP 한 페이지 탭 |
| 6 | Reports | `/reports` | 내부 | 리포트 |
| 7 | Accounts | `/account` | Admin만 | Users, Item Type, Expense, Debit/Credit **탭** |
| 8 | Inventory | `/inventory` | 내부 | 창고별 재고 |
| 9 | Consolidation | `/consolidation` | 내부 | 통합 로드 |
| 10 | EDI | `/edi` | 내부 | EDI Config + EDI List **탭** |
| 11 | Settings | `/setting` | Admin만 | Default, City, Type/SubType, Permission **탭** |

- **레이아웃**: 좌측 고정 사이드바(약 14rem) + 메인 영역. 포털 사용자는 Dashboard / My Loads / My Invoices·Payables / Logout만 노출.
- **패턴**: 대부분 **한 라우트 = 한 페이지**, Settings·Account·EDI·PartnerDetail 등은 **페이지 내 탭**으로 하위 기능 분리.

### 1.2 페이지별 구조 패턴

| 페이지 | 패턴 | 비고 |
|--------|------|------|
| Order | 목록 + 필터(상태/고객/날짜/검색) + bulk 상태 변경 | 테이블, New Load는 별도 페이지 |
| Partner | 목록 + 타입 필터(All/Customer/Carrier) + New Partner | 상세는 `/partner/:id` |
| PartnerDetail | **탭**: Detail, Locations, Staff, Contacts, Vehicles | 캐리어만 Contacts/Vehicles 표시 |
| Invoicing | **탭**: AR / AP | 한 화면에 AR 테이블 + AP 테이블 |
| Account | **탭**: Users, Item Type, Expense, Debit/Credit | Admin 전용 |
| Setting | **탭**: Default, City, Type/SubType, Permission | Admin 전용 |
| Inventory | 창고 선택 + 항목 테이블(전체/창고별) + 필터 | 모달로 Add/Edit |
| Consolidation | 좌측 목록 + 우측 상세(Shipper/Consignee 테이블) | |
| Edi | **탭**: EDI Config, EDI List | |
| LoadDetail | 단일 로드 편집(Shipper/Consignee/Carrier 구간, Reference 등) | 폼 중심 |

### 1.3 현재 구조의 특징

- **Partners**: Customer와 Carrier를 **하나의 “Partners” 메뉴**에서 타입 필터로만 구분. 목록 컬럼은 이름·타입·연락처·주소·도시 등 공통 위주.
- **Invoicing vs Account**: AR/AP는 **Invoicing**, Expense·Debit/Credit·Item Type·Users는 **Accounts(Admin)**. “회계/정산”이 두 메뉴로 나뉨.
- **설정**: City, Type/SubType, Permission을 **Settings 한 페이지의 탭**으로 처리. “마스터 데이터”와 “기본 설정(Default)”이 한곳에 있음.
- **Order**: 라벨은 “Orders”. 참조에서는 “Dispatch” 또는 “Order”로 불릴 수 있음.
- **캐리어 상세**: Detail / Locations / Staff / Contacts / Vehicles 탭 있음. **History(이력/감사 로그)** 탭은 없음.

---

## 2. 참조 솔루션에서 추정되는 구조 (문서·체크리스트 기반)

이미지(사진)와 비교 문서를 바탕으로 **참조 솔루션의 UI·구조**를 추정한 내용이다.

### 2.1 메뉴·정보 구조 추정

| 영역 | 참조 추정 | 근거 (비교 문서) |
|------|-----------|-------------------|
| **배차/주문** | “Dispatch” 또는 “Order” | Order 목록, Order Add, Shipper/Consignee/Carrier 구간 |
| **통합 로드** | Consolidation 별도 메뉴 또는 Order 하위 | “Consolidation Active Load - New”, Customer/Shipper Carrier/Consignee Carrier 테이블 |
| **고객** | **Customer** 목록·상세 별도 | “Customer 목록”, “Customer Name” 등 |
| **캐리어** | **Carrier** 목록·상세 별도 | “**CARRIER** (CODE, NAME, DATE CREATED, POSTAL CODE, PHONE NO, ACTIVE, ACTION)”, “Carrier Detail (Detail/History 탭)” |
| **회계** | **Account** 하나에 AR·AP·Expense·Debit/Credit·Item Type | “Account AR List”, “Account AP List”, “Add Expense”, “Expense Detail”, “ADD DEBIT CREDIT”, “Item Type List” |
| **이익** | Profit (요약·고객별·Expense Detail 뷰) | “Profit”, “Profit Customer”, “Expense Detail” |
| **재고** | Inventory (Item#, Name, Size, Qty, Cost, Total, Entry Date, Note, 날짜 필터) | clone 체크리스트 |
| **설정** | City / Type/SubType / Permission / Default | “City”, “Add City”, “Add New Type”, “Permission List”, “Permission Add”, “Setting_Default” |

즉 참조는:

1. **Customer와 Carrier를 메뉴에서 분리**했을 가능성이 높음 (캐리어 전용 목록·상세 화면이 있고, 컬럼도 CODE, DATE CREATED, ACTIVE 등으로 다름).
2. **Account(회계)** 를 한 묶음으로 두고, 그 안에 AR, AP, Expense, Debit/Credit, Item Type을 두는 구조로 보임.
3. **캐리어 상세**에 **Detail / History** 탭이 있음 (우리는 History 없음).
4. **설정**은 City, Type/SubType, Permission, Default를 **명확히 구분**한 화면/섹션으로 가져갈 가능성.

### 2.2 목록·컬럼 추정

| 화면 | 참조 추정 컬럼/요소 | 우리와의 차이 |
|------|---------------------|----------------|
| **Carrier 목록** | CODE, NAME, DATE CREATED, POSTAL CODE, PHONE NO, ACTIVE, ACTION | 우리: name, type, contact_email, contact_phone, address, city… **code, created_at, is_active** 노출 부족할 수 있음 |
| **Locations** | Created, Name, Address, City, State, Zip, Contact Info, Memo, Edit, Delete, Active 필터 | 우리: Name, Address, City, Tel, Active, Action. **Created, Memo(Notes), Contact Info** 표현 방식 다름 |
| **Permission** | Permission Name, Created, Edit, Delete, + Add | 우리: Setting > Permission 탭에서 유사하나 **Created** 강조 여부 |
| **Inventory** | Item#, Name, Size, Qty, Cost, Total, Entry Date, Note, Search, From/To Date | 우리: 구현됨. 레이아웃/라벨만 정리 가능 |

### 2.3 상세·폼 구조 추정

| 화면 | 참조 추정 | 우리 |
|------|-----------|------|
| **Carrier Detail** | **Detail** 탭(기본정보·규제·결제) + **History** 탭(이력/변경 로그) | Detail, Locations, Staff, Contacts, Vehicles. **History 없음** |
| **Order Add** | Bill To, Order Date, Order ID, Freight ID, Active/Hold, Type, Ref Number 등 섹션화 | LoadDetail에 일부 필드 있음. 그룹핑·라벨 차이 가능 |
| **Add Expense** | Item Type, Ref No., Bill To, PO No., Memo, Date, Amount, Tax Amount, Account, Vendor | Account > Expense 탭에서 유사 구현 |
| **Debit/Credit** | Type, Reason, Debit/Credit Amount, Customer Code, Tax#, Email, **Note/Attach/Share 탭** | 우리: Note 등 필드 있음. **Attach/Share 탭** 유무 확인 필요 |

---

## 3. 갭 요약 (구조·UX 관점)

### 3.1 네비게이션·정보 구조

| 항목 | 참조 추정 | 현재 우리 | 갭 |
|------|-----------|-----------|-----|
| Customer / Carrier | **별도 메뉴** 또는 별도 목록 뷰 | **Partners 하나** + 타입 필터 | Customer와 Carrier를 **메뉴 또는 뷰에서 분리**하면 참조에 가깝고, 역할별로 “고객만 / 캐리어만” 보기 쉬움 |
| 회계(Account) | **AR·AP·Expense·Debit/Credit·Item Type**을 한 “Account” 하위로 | **Invoicing**(AR/AP) + **Accounts**(Users, Item Type, Expense, Debit/Credit) | “회계”를 하나로 묶고, AR/AP/Expense/Debit/Credit/Item Type을 **하위 탭 또는 서브메뉴**로 두는 구조 검토 |
| 설정(Settings) | City, Type/SubType, Permission, Default를 **구분된 화면/섹션** | Settings 한 페이지에 **탭 4개** | 기능은 동일. **라벨·순서·그룹**만 참조와 맞추면 됨 |
| Order 라벨 | “Dispatch” 또는 “Order” | “Orders” | 용어만 통일하면 됨 (Dispatch vs Order) |

### 3.2 목록 뷰

| 항목 | 참조 추정 | 현재 우리 | 제안 |
|------|-----------|-----------|------|
| Carrier 목록 | CODE, NAME, DATE CREATED, POSTAL CODE, PHONE NO, ACTIVE, ACTION | code/created_at 노출 약함 | Carrier(또는 Partners 캐리어 필터) 목록에 **Code, Created, Active** 컬럼 추가·정렬 |
| Locations 테이블 | Created, Name, Address, City, State, Zip, Contact Info, Memo, Active | Name, Address, City, Tel, Active | **Created(entry_date), Memo(Notes)** 컬럼 명시 |
| Permission 목록 | Permission Name, Created, Edit, Delete | Name, Edit, Delete | **Created** 컬럼 추가 |

### 3.3 상세·탭

| 항목 | 참조 | 현재 우리 | 제안 |
|------|------|-----------|------|
| Carrier Detail 탭 | **Detail** + **History** | Detail, Locations, Staff, Contacts, Vehicles | **History 탭** 추가 (변경 이력/감사 로그 API·뷰). 단기엔 “최근 변경 일시/담당자” 정도만이라도 |
| Debit/Credit | Note / Attach / Share 탭 | 단일 폼 | 첨부·공유가 참조에 있다면 **Attach/Share** 영역 또는 탭 검토 |

### 3.4 기타

- **Consolidation**: 참조는 “Shipper 1/2, Consignee 1”처럼 **구간별 색상·시각 구분**이 있을 수 있음. 우리는 목록+상세 구조만 맞춤. UI만 참조 스크린샷에 맞춰 다듬을 수 있음.
- **Order Add / Load Detail**: 필드 구성은 비슷하나 **섹션 제목·순서**(Bill To, Order ID, Freight ID, Shipper/Consignee 블록 등)를 참조 화면 순서로 재배치하면 익숙함 향상.

---

## 4. “최선의 구조” 관점 정리

### 4.1 지금 구조가 나쁜가?

- **아니요.** 기능은 clone 체크리스트 기준으로 대부분 반영되어 있고, **한 사이드바에 모든 메뉴**를 두는 방식은 작은~중간 규모 TMS에 흔한 패턴입니다.
- 다만 **참조 솔루션을 쓰던 사용자** 입장에서는 “Customer와 Carrier가 따로 보이지 않음”, “AR/AP가 Invoicing에만 있고 Expense는 Accounts에 있음”, “캐리어 상세에 History가 없음” 등이 **다르게 느껴질 수** 있습니다.

### 4.2 참조에 더 가깝게 하려면 (우선순위 제안)

1. **네비게이션**
   - **Option A**: 사이드바에 **Customer**, **Carrier**를 **Partners와 동급**으로 분리 (예: Partners 제거 후 “Customer” / “Carrier” 두 메뉴). 각각 목록·상세는 기존 Partner 목록/상세를 타입으로 필터해 재사용.
   - **Option B**: Partners는 유지하되, **목록 상단 탭**을 “All | Customer | Carrier” 대신 **“Customers” / “Carriers”** 두 개의 **별도 뷰**처럼 보이게 하고, Carrier 뷰에서는 컬럼을 **CODE, NAME, DATE CREATED, POSTAL CODE, PHONE NO, ACTIVE, ACTION** 중심으로 변경.
2. **Account(회계) 통합**
   - **Invoicing**을 “Account” 또는 “Finance” 하위로 넣고, Account 메뉴 하나에 **AR | AP | Expense | Debit/Credit | Item Type** (및 필요 시 Users)을 **탭 또는 서브메뉴**로 두기.  
   - 또는 Invoicing 이름을 **“Account”** 로 바꾸고, 그 안에 **AR, AP, Expense, Debit/Credit, Item Type** 탭을 두고, **Users**는 “Settings” 또는 “Admin” 하위로 이동.
3. **캐리어 상세**
   - **History 탭** 추가: 최소한 “최근 수정 일시 / 수정자” 등 감사 필드 표시. 가능하면 API에서 변경 이력 목록을 주고 타임라인 형태로 표시.
4. **목록 컬럼**
   - Carrier(또는 Partners 캐리어): **Code, Name, Date Created, Postal Code, Phone, Active, Action**.
   - Partner Locations: **Created, Name, Address, City, State, Zip, Contact Info, Memo, Active, Edit/Delete**.
   - Permission: **Permission Name, Created, Edit, Delete**.
5. **설정**
   - 현재처럼 **Settings** 한 페이지에 Default / City / Type/SubType / Permission 탭 유지해도 됨. 참조가 섹션을 더 나눠 두었다면 **섹션 제목·카드 구분**만 넣어서 비슷하게 보이게 하면 됨.

### 4.3 구조보다 먼저 맞출 것

- **데이터·기능**은 이미 clone 체크리스트로 대부분 반영됨.
- **라벨·컬럼명·필드 순서**를 참조와 맞추는 것만으로도 “같은 시스템” 느낌을 많이 줄 수 있음 (예: Order ↔ Dispatch, Carrier 목록 컬럼, Add Expense 필드 순서).
- **History**는 “감사/이력” 요구가 있으면 추가하고, 없으면 Phase 2로 미뤄도 됨.

---

## 5. 결론 및 다음 단계 제안

- **현재 웹 구조**는 기능 기준으로는 **충분히 쓸 수 있는 구조**이며, 참조와의 차이는 주로 **(1) 메뉴 분리 방식(Customer vs Carrier, Account 통합), (2) 목록 컬럼·라벨, (3) Carrier Detail의 History 탭**입니다.
- **참조와 최대한 비슷하게** 가려면:
  - Customer / Carrier를 **메뉴 또는 뷰 단위로 분리**하고,
  - **Account** 아래에 AR, AP, Expense, Debit/Credit, Item Type을 묶고,
  - Carrier 목록·Locations·Permission 목록에 **참조 컬럼**(Code, Created, Active 등)을 맞추고,
  - 캐리어 상세에 **History 탭**을 두는 방향을 권장합니다.
- **문서화**: 실제 참조 스크린샷에서 메뉴 이름·순서·테이블 헤더를 추려서 **“참조 메뉴/화면 매핑표”**를 한 장 더 만들면, 이후 UI 조정 시 누락 없이 맞추기 좋습니다.

이 문서를 기준으로 “메뉴 분리(Partners → Customer/Carrier)”, “Account 통합”, “History 탭”, “목록 컬럼 정리” 중 어디부터 적용할지 우선순위를 정하면 됩니다.

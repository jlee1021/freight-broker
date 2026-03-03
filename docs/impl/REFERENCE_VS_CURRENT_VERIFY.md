# 참조 솔루션(이미지) vs 현재 구현 — 재확인

> 사용자 제공 **clone 참조 이미지**에 나온 구성과, **현재 freight-broker 구현**을 항목별로 비교한 문서입니다.  
> “다르게 구성되어 있다”고 하신 부분을 갭 분석 문서와 실제 코드 기준으로 정리했습니다.

---

## 1. 대시보드 (Main Dashboard)

### 참조 이미지 기준 (갭 분석 문서)

| 순서 | 블록 | 내용 |
|------|------|------|
| 1 | **AP (미지급) 요약** | 상단 **좌측 2줄** 요약 (AP 관련 수치) |
| 2 | **Top 10 Entities** | Name, **Balance(2종)**, **Debt**, **Target**, **%** 컬럼 (퍼센트 = 기여도/달성률) |
| 3 | **Recently Dispatched** | **Date**, **Client** 컬럼 (참조는 Client 강조) |
| 4 | **Profit (Sales)** | Revenue / Expenses / Profit **3색 막대 차트**, 기간별 (MONTHLY, 2024.01, 2024.02) |
| 5 | **Profit (Costs)** | 동일 스타일의 **“비용” 관점** 차트 (기간별) |
| 6 | **Profit (Customers)** | Customer, Revenue, Expense, **Weight(%)**, **EDI**, Actions 테이블 |
| 7 | **Profit (Loads)** | Service, Expense, Weight, EDI, Actions 테이블 (로드별 수익 상세) |

### 현재 구현

| 순서 | 블록 | 차이 요약 |
|------|------|-----------|
| 1 | 기간 선택 + 에러/로딩 | 참조에는 없음. 우리는 상단에 Period 드롭다운 |
| 2 | **Alerts** (연체/보험) | 참조 문서에 “Alerts” 블록 명시 없음 |
| 3 | **AP 요약** | 3개 카드 (Total AP, Unpaid AP, Unpaid AP Count). 참조는 **2줄** 요약 |
| 4 | **KPI 카드** | Loads, Revenue, Cost, Profit, AR. 참조에는 이 5개 카드 구성 없음 — 참조는 AP 후 Top 10 |
| 5 | **Top 10 Customers** | Customer, Balance, Income, Cost, Profit, **Ratio %**. 참조는 **Debt, Target, %(2종)** 등 다른 컬럼 |
| 6 | **Recently Dispatched Carriers** | Date, **Carrier**, Load. 참조는 **Client** 컬럼 |
| 7 | **Profit (Loads) by period** | Revenue/Cost/Profit 막대 1개. 참조는 **Profit (Sales)** + **Profit (Costs)** 2개 차트, 그리고 **Profit (Customers)** / **Profit (Loads)** **테이블** |
| 8 | **Recent Loads** | 테이블. 참조 문서에 “Recent Loads” 명시 없음 |
| 9 | **Loads by Status** | 가로 막대. 참조 문서에 동일 블록 없음 |

**정리**:  
- **블록 순서**가 다름: 참조는 AP → Top 10 → Recently Dispatched → Profit 차트/테이블. 우리는 Alerts → AP → KPI 5개 → Top 10 + Recently Dispatched → Profit 차트 1개 → Recent Loads → Loads by Status.  
- **Top 10**: 참조는 Debt, Target, %(기여/달성). 우리는 Balance, Income, Cost, Profit, Ratio %.  
- **Recently Dispatched**: 참조는 **Client**. 우리는 **Carrier**, Load.  
- **Profit**: 참조는 (Sales) 차트 + (Costs) 차트 + (Customers) 테이블 + (Loads) 테이블. 우리는 “Profit (Loads) by period” **차트 1개**만 있음. **(Customers)/(Loads) 테이블·(Costs) 차트 없음.**

---

## 2. 사이드바 (메뉴 구조)

### 참조 이미지 기준 (갭 분석 §15 Permission)

- **Dispatch**: Order, Consolidation, EDI, OSD  
- **Partner**: Customer, Staff, Carrier, Location  
- **Account**: AR, AP, Expense, Debit Credit, Item Type List  
- **Inventory**: List  
- **Setting**: User, Permission, City, Default  
- **Profit**: Customer, Expense Detail  

### 현재 구현

- **Dispatch**: Order, **OS List**, OSD, Consolidation, EDI  
  - 참조에는 “OS List”가 **Permission 매트릭스**에는 있으나 **사이드바 메뉴명**이 문서에 없음. 참조 이미지에 “OS List”가 별도 메뉴로 있으면 순서/이름 일치 여부 확인 필요.
- **Partner**: Customer, **Location**, Carrier, **Staff**  
  - 참조는 Customer, **Staff**, Carrier, Location → **순서 다름** (Location이 우리는 2번째, 참조는 4번째).
- Account / Inventory / Setting / Profit 하위는 문서와 유사.

**정리**: Partner 하위 메뉴 **순서**가 참조와 다름 (Customer → Staff → Carrier → Location vs 우리: Customer → Location → Carrier → Staff).

---

## 3. Order (Dispatch) 리스트

### 참조 이미지 기준 (갭 분석 §8)

- 필터: Load#(2종), **Est. Pickup/Delivery Time**, **Select role**, Filter, **Apply**, **Clear**, **Add**
- 상태: Pending, Unassigned, On Hold, **Good To Go**, Assigned, In Transit, Delivered, **Exception**, Cancel
- 테이블: Load #, Status, **Weight**, Created, Customer, **Pickup Carrier**, **Equipment**, **Pickup City, Pickup State, Pickup Date, Pickup Time**, **Dest. Port, Dest. Weight**, **Unload Date, Unload Time**, **Consolidation City, Consolidation State**, **Delivery Carrier**, **Consignee**, **Consignee City, Consignee State**, **Delivery Date, Delivery Time**, Revenue, Profit, **Created By**, **Parent**

### 현재 구현

- 필터: Load#, P.O/Ref, Customer, Created From/To, Apply, Clear.  
  → **Est. Pickup/Delivery Time, Select role, Add** 없음.
- 상태: pending, unassigned, on_hold, need_to_cover, good_to_go, assigned, in_transit, delivered, exception, cancel.  
  → 값은 비슷함. **표기**만 “Good To Go” vs good_to_go 등.
- 테이블: Load #, Status, Customer, Dispatcher, Equipment, Weight, Pickup City, Pickup Date, Delivery City, Delivery Date, Rate, Revenue, Cost, Profit, Created.  
  → **Pickup Carrier, Pickup State, Pickup Time, Dest. Port, Dest. Weight, Unload Date/Time, Consolidation City/State, Delivery Carrier, Consignee, Consignee City/State, Delivery Time, Created By, Parent** 없음.

**정리**: 컬럼·필터가 참조보다 적고, **컬럼 이름·구성**이 참조와 다름 (참조는 Pickup Carrier / Dest. Port / Unload / Consolidation / Delivery Carrier / Consignee / Created By / Parent 등).

---

## 4. OS List (Order Sheet)

### 참조 이미지 기준 (갭 분석 §7)

- 검색: **Search order type**
- 필터: **Contract type**, 날짜(From~To), **Status**
- 버튼: **Apply**, **Clear**, **Export**, **Add New**
- 상태 버튼: **All List**, **Out Order**, **On Going**, **Receiving**, **Complete** (즉 **Pending 없음**)
- 테이블: **No**, **Order Code**, **Buyer**, **Sales Rep**, **Customer PO**, **Load Date**, **Deliver Date**, **Product Name**, **Qty**, **Unit Price**, **Currency**, **Invoice**, **Tax**, **Subtotal**, **Total**, Actions

### 현재 구현

- 검색: “Order Code” 텍스트 입력 (라벨이 **Search order type** 아님)
- 필터: Load Date From/To, Order Code. **Contract type** 필터 있음(API). UI에 **Contract type** 드롭다운 없을 수 있음.
- 버튼: Apply, Clear, **Add New**. **Export** 없음.
- 상태: **all**, **pending**, out_order, on_going, receiving, complete.  
  → 참조는 **All List** + Pending 없음. 우리는 “All” + “pending” 있음.
- 테이블: Order Code, Status, Customer, Buyer, Sales Rep, Customer PO, Load Date, Deliver Date, Product Name, Qty, Unit Price, Currency, Tax, Subtotal, Total, Invoice #, Memo, Actions.  
  → 참조는 **No**(행 번호), **Invoice** 순서 등. **Customer** 컬럼 우리가 넣음. 대체로 유사하나 **라벨/순서** 차이 가능.

**정리**:  
- 상태 버튼 **라벨**: 참조 “All List” / 우리 “All”; 참조에 없는 **pending** 우리는 있음.  
- **Search order type** vs “Order Code” 검색.  
- **Export** 버튼 없음.  
- **Contract type** 필터가 UI에 노출되어 있는지 확인 필요.

---

## 5. AP List (Accounts Payable)

### 참조 이미지 기준 (갭 분석 §9)

- 검색/필터: **Search Load No.**, **Search Customer Name**, Customer Name·Carrier Name 드롭다운, **From/To**, **Amount 범위**
- 상태 버튼: **Unpaid**, **Paid**, **Overdue**, **Upcoming**
- 테이블: No., Status, **Updated**, Load #(링크), **Delivery**, Customer, Carrier, **Item Type**, Amount, **Balance**, Actions

### 현재 구현

- 검색/필터: 없음 (AR/AP 공통 페이지에서 AP만 보이면 필터 없음).
- 상태 버튼: **All**, **Unpaid**, **Paid**.  
  → **Overdue**, **Upcoming** 없음.
- 테이블: Invoice #, Load, Carrier, Amount, Status, Actions.  
  → **Updated, Delivery, Item Type, Balance** 없음.

**정리**: AP는 **상태 4종(Unpaid/Paid/Overdue/Upcoming)**, **검색·필터**, **테이블 컬럼(Updated, Delivery, Item Type, Balance)** 이 참조와 다름.

---

## 6. 파트너(회사) 상세 — 탭 구성

### 참조 이미지 기준 (갭 분석 §3, §5, §6)

- **공통/회사**: Company Info (이름, 주소, 업로드 파일), **API Works**, **Load Confirmation Email**, **Driver Display**, **Team Memberships**, **Service Items**
- **고객(Customer)**: 탭 **General**, **EDI**, **Load Setup**, **Quick View**. Billing: Currency, Credit Term, Expense Term, Discount %, Save POs
- **캐리어(Carrier)**: 탭 **Group**, **History**. Operation Info, Payment Info, Postal Message

### 현재 구현

- 파트너 상세 탭: **Detail**, **Locations**, **Staff**, **Teams**, **Services**, **Email Templates**, (캐리어만) **Contacts**, **Vehicles**, **Operation Info**
- 고객 전용 탭 **EDI, Load Setup, Quick View** 없음. Billing 필드가 Detail 안에 일부만 있을 수 있음.
- 캐리어 전용 탭 **Group, History** 없음.

**정리**:  
- 참조는 **Customer**일 때 General / EDI / Load Setup / Quick View. 우리는 **타입 구분 없이** Detail, Locations, Staff, Teams, Services, Email Templates…  
- 참조는 **Carrier**일 때 Group / History. 우리는 Group/History 탭 없음.  
- 즉 **탭 이름·구성**이 참조와 다름 (고객 vs 캐리어 구분된 탭 세트가 아님).

---

## 7. Permission (Setting)

### 참조 이미지 기준 (갭 분석 §15)

- **Permission Name**, **Description**
- **모듈별 CRUD 매트릭스**:
  - **Dispatch**: Order, Consolidation, EDI, OSD (각 Create/Read/Update/Delete)
  - **Partner**: Customer, Staff, Carrier, Location
  - **Account**: AR, AP, Expense, Debit Credit, Item Type List
  - **Inventory**: List
  - **Setting**: User, Permission, City, Default
  - **Profit**: Customer, Expense Detail
- **Save**, Cancel

### 현재 구현

- Permission 목록 + **Resource × Action(read, write, delete, manage)** 단순 매트릭스.
- **모듈(메뉴) 단위** (Dispatch / Partner / Account …) 로 나누고, 각 하위 리소스별 **Create / Read / Update / Delete** 4종으로 두는 구조 아님.

**정리**: 참조는 **모듈 > 하위 리소스 × C/R/U/D** 그리드. 우리는 **리소스 × read/write/delete/manage** 단순 테이블이라 **구성·표현**이 다름.

---

## 8. Consolidation

### 참조 이미지 기준 (갭 분석 §10)

- 요약: **Total of N**, **Total Profit $**, **Total Weight**, **Total Measures**, **Total Item(s)**
- 메인 테이블: LOAD #, STATUS, CUSTOMER, CARRIER, PICKUP DATE/TIME/ADDRESS/CITY/STATE/ZIP/CONTACT, DELIVERY 동일, LOAD TYPE, WEIGHT, MEASURES, ITEM COUNT, COMMODITY, REVENUE, COST, PROFIT, CREATED BY, MEMO
- 상태: Pending, Unassigned, On Hold, **Ready to Load**, Dispatched, In Transit, Delivered, **Invoiced**, Cancelled

### 현재 구현

- 요약: **Total Pallets (Shipper/Consignee)**, **Total Weight (Shipper/Consignee)** 만 추가됨.  
  → **Total Profit $**, **Total Measures**, **Total Item(s)** 없음.
- 메인 테이블/상세: Consolidation 번호, Shippers/Consignees 테이블. 참조만큼 LOAD #, REVENUE, COST, PROFIT 등 **메인 테이블 컬럼**은 없을 수 있음.
- 상태: 참조의 **Ready to Load**, **Invoiced** 등과 값 세트가 다를 수 있음.

**정리**: 하단 요약이 참조는 **Total Profit $, Total Weight, Total Measures, Total Item(s)**. 우리는 Pallet/Weight 위주. **구성·라벨**이 다름.

---

## 9. OSD

### 참조 이미지 기준 (갭 분석 §12)

- 필터: **Search on Load**, Status, Amount, Customer, Shipper/Carrier, AR, AP, **Ship Date From/To**, **Delivery Date From/To**, Apply, Clear, **Add**
- 테이블: #, Load, Date, **Ref. #**, Amount, Customer, Shipper, Carrier, **Expired Cargo**, **Company Name**, AR, AP, **Due Date**, Action(View, Delete)

### 현재 구현

- 필터: OSD Type, Ship Date From/To, Apply, Clear. **Search on Load, Delivery Date From/To**, Amount/Customer/Shipper/Carrier/AR/AP 필터 없음.
- 테이블: Ref#, Status, Type, Load, Customer, Shipper, Carrier, Amount, AR Amount, AP Amount, Ship Date, Delivery Date, Due Date, Expired, Company, Actions.  
  → 대체로 유사. **#(행 번호)** 등 순서/라벨만 맞추면 됨.

**정리**: OSD는 **필터 항목**(Search on Load, Delivery Date From/To 등)이 참조보다 적음.

---

## 10. 요약 — “다르게 구성된” 부분 정리

| 구역 | 참조와 다른 점 (우선 확인 권장) |
|------|--------------------------------|
| **대시보드** | ① 블록 **순서** (AP → Top 10 → Recently Dispatched → Profit 차트/테이블). ② Top 10에 **Debt, Target, %** 컬럼. ③ Recently Dispatched **Client** 컬럼. ④ **Profit (Sales)** + **Profit (Costs)** 차트 2개 + **Profit (Customers)** / **Profit (Loads)** 테이블. ⑤ AP는 **2줄** 요약. |
| **사이드바** | Partner 하위 **순서**: 참조 Customer → Staff → Carrier → Location / 우리 Customer → Location → Carrier → Staff. |
| **Order 리스트** | 필터(Est. Pickup/Delivery, Select role, Add), 테이블 컬럼(Pickup Carrier, Dest. Port, Unload, Consolidation, Delivery Carrier, Consignee, Created By, Parent 등) **대폭 부족**. |
| **OS List** | 상태 “**All List**” / **Pending** 유무, “**Search order type**” 라벨, **Export** 버튼, **Contract type** 필터 UI. |
| **AP List** | 상태 **Overdue, Upcoming**, 검색/필터(Load No, Customer, Carrier, From/To, Amount), 컬럼 Updated, Delivery, Item Type, Balance. |
| **파트너 상세** | 고객 전용 탭 **EDI, Load Setup, Quick View**. 캐리어 전용 탭 **Group, History**. Billing(Currency, Credit Term 등) 섹션. |
| **Permission** | **모듈별** (Dispatch/Partner/Account/…) × **하위 리소스** × **Create/Read/Update/Delete** 매트릭스. |
| **Consolidation** | 하단 요약 **Total Profit $, Total Measures, Total Item(s)** 및 메인 테이블 컬럼/상태값. |

---

이 문서를 기준으로 **어디부터 참조 이미지와 맞출지** 우선순위를 정하시면, 그에 맞춰 수정 단계 제안해 드리겠습니다.  
참조 이미지를 다시 공유해 주시면, **화면 레이아웃·순서·라벨**을 더 정확히 맞출 수 있습니다.

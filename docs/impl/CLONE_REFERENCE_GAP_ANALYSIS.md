# Clone 대상 참고 솔루션 vs 현재 솔루션 갭 분석

> 사용자가 첨부한 참고 솔루션 스크린샷을 기준으로, **현재 freight-broker에 없는 기능·정리되지 않은 부분**을 정리한 문서입니다.  
> **수정(구현)은 확인 후 진행**할 예정이므로, 본 문서는 검토용 체크리스트로 활용하세요.  
> **작성일**: 2026-03-03  

---

## 1. 대시보드 (Main Dashboard)

### 참고 솔루션에 있는 것

| 구성 요소 | 설명 |
|-----------|------|
| **AP (미지급) 요약** | 상단 좌측 2줄 요약 (AP 관련 수치) |
| **Top 10 Entities** | Name, Balance(2종), Debt, Target, **%** 컬럼. 퍼센트로 기여도/달성률 표시 |
| **Recently Dispatched Carriers** | Date, **Client** 컬럼 (참고: 우리는 Date, Carrier, Load) |
| **Profit (Sales)** | Revenue / Expenses / Profit 3색 막대 차트, 기간별 (MONTHLY, 2024.01, 2024.02) |
| **Profit (Costs)** | 동일 스타일의 “비용” 관점 차트 (기간별) |
| **Profit (Customers)** | Customer, Revenue, Expense, **Weight(%)**, **EDI**, Actions 테이블 |
| **Profit (Loads)** | Service, Expense, Weight, EDI, Actions 테이블 (로드별 수익 상세) |

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| AP 요약 블록 | **없음** | 대시보드 상단 전용 “AP” 요약 영역 없음 (AR은 KPI 카드 1개만 있음) |
| Top 10 Entities | **부분** | “Top 10 Customers”는 있음. **Debt, Target, %(기여/달성)** 컬럼 없음 |
| Recently Dispatched | **있음** | Date, Carrier, Load. 참고는 “Client” 강조 → 필요 시 Client 컬럼/표기 추가 검토 |
| Profit (Sales) 차트 | **있음** | 기간별 Revenue/Cost/Profit 막대 차트 구현됨 (Phase 2) |
| Profit (Costs) 차트 | **없음** | “비용 관점” 전용 차트 없음 (동일 데이터 다른 뷰일 수 있음) |
| Profit (Customers) 테이블 | **부분** | Top 10 Customers에 Revenue/Cost/Profit/Ratio 있음. **Weight(%), EDI** 컬럼 없음 |
| Profit (Loads) 테이블 | **없음** | 로드별 Service/Expense/Weight/EDI 테이블 없음 (Reports에는 다른 형태로 존재 가능) |

---

## 2. 로드/오더 폼 (Active Load: New)

### 참고 솔루션에 있는 것

- **헤더**: Customer, Rate CAD, %(할인/마진), Tax Code, **Revenue / Cost / Loaded Cost / Profit($) / Profit(%)** 실시간 표시, Other Charges 버튼, Auto Data·Return 체크
- **Waybill**: Type of Waybill(APPRENTICE, AMPAY, MAFI 등), Load #, **PROFIT %**, Load Status, Driver #, Load Customer, Amount
- **감사**: Created By, Last Modified By
- **픽업**: Unpack, Join 버튼. Address, Customer, City/Province/Country, Location Type, Live Load, Date/Time, Appointment, Arrival Time, Temperature, Seal #, Comments, What My Bank, Ship Via, Other
- **딜리버리**: Stop Number, Address Type(Origin/Destination), Special Instructions, Internal Notes, Customer/Contact/Phone/Email, Sync/Clear, Time, Loaded Status, Unassigned, **Add**(다중 스탑)
- **컨솔/팔렛**: Consolidate, Add. Consignee, Location Type, Live Load, Date/Time, Appointment, **Pallet**: Temperature, QTY, Cubic Weight, Weight, Unit, Length, Width, Height, **Hazardous Material**, Comment
- **빌링**: Stop 2, Billing Type, Billing Address Type, Special Instructions, Internal Notes, Customer/Contact/Phone/Email, Time, Loaded Status, Unassigned, **Add**

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| Revenue/Cost/Profit 실시간 표시 | **부분** | LoadDetail에 수익/비용/이익 필드 있을 수 있으나, 참고처럼 한 줄 요약·자동 계산 강조는 미확인 |
| Other Charges 버튼 | **미확인** | 별도 “Other Charges” 서브폼/모달 유무 확인 필요 |
| Type of Waybill | **없음** | Waybill 유형 드롭다운 없음 |
| Driver #, Load Customer, Amount (헤더) | **미확인** | Load 모델/폼에 동일 필드 유무 확인 필요 |
| Created By / Last Modified By | **부분** | created_by, last_modified_by 등 DB에는 있을 수 있음. **화면 노출** 확인 필요 |
| Unpack / Join | **없음** | 로드 분할/합치기 전용 버튼 없음 |
| 픽업: Temperature, Seal #, Appointment, What My Bank, Ship Via | **부분/없음** | ShipperStop 등에 일부만 있을 수 있음. **Seal #, What My Bank, Ship Via** 등 누락 가능 |
| 딜리버리: 다중 스탑, Address Type, Sync/Clear | **부분** | 다중 스탑 구조는 있음. **Address Type(Origin/Destination), Sync/Clear** UI 확인 필요 |
| Consolidation/Pallet: Cubic Weight, L×W×H, Hazardous Material | **부분/없음** | 팔렛/화물 상세 필드가 참고만큼 세분화되어 있는지 확인 필요 |
| Billing: 별도 Stop/세그먼트, Billing Type | **없음** | “Billing Information”을 픽업/딜리버리와 별도 스탑으로 관리하는 구조·UI 없음 |

---

## 3. 파트너(회사) 상세 – Company Info / API / 이메일 / 팀 / 서비스

### 참고 솔루션에 있는 것

- **Company Info**: Company Name, Address, City, Province, Postal Code, Phone, Fax, Billing Address, **Upload File**
- **API Works**: API 키/시크릿/엔드포인트 등 연동 설정 (입력 필드 다수)
- **Load Confirmation Email**: Send Reply 체크, Email Subject, Email Body, Leading Team
- **Driver Display**: Email Subject, Email Message, 기타 드라이버용 설정
- **Team Memberships**: Name, Role(Admin, Viewer 등), 행별 **X(삭제)**, **Add Member**
- **Service Items**: Item(Air freight, FCL, LCL, LTL, Ocean freight), Type, Quantity, **X(삭제)**, **Add Item**

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| Company Info 기본 필드 | **있음** | PartnerDetail에 주소·연락처 등 있음 |
| Upload File (회사 문서) | **미확인** | 파트너별 파일 첨부 기능 유무 확인 필요 |
| API Works | **없음** | 외부 API 연동 설정 전용 섹션 없음 |
| Load Confirmation Email | **없음** | 이메일 제목/본문 템플릿 설정 없음 |
| Driver Display | **없음** | 드라이버용 이메일/표시 설정 없음 |
| Team Memberships | **없음** | 파트너별 “팀”(Name, Role) 테이블·추가/삭제 없음 |
| Service Items | **없음** | 서비스 유형(Item, Type, Quantity) 테이블·추가/삭제 없음 |

---

## 4. 오더 리스트 (EDI 연계 Order List)

### 참고 솔루션에 있는 것

- 필터: Load Order, Delivery, **From/To**, Load No, **P.O NO**, **LANE ID**, shipper/customer, Bill to, **Apply / Clear**
- 테이블: Load Order, Status, **Order**, **Qty**, **Weight**, **Volumn**, **Product Name**, Pick Up, Delivery, **Invoice**, **Billing Type**, Bill TO, From Address, **Loading City**, To Name, **Track**, **EDI #**, **Booking Number**, Created, **Memo**
- **QTY Export**, 페이지당 건수, 페이징

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| 필터: Load#, Customer, From/To | **있음** | Order 페이지에 검색·고객·기간 필터 있음 |
| P.O NO, LANE ID, Bill to 필터 | **없음** | 없음 |
| 컬럼: Load#, Status, Rate, Revenue, Cost, Created | **있음** | 참고보다 컬럼 수 적음 |
| Order, Qty, Weight, Volumn, Product Name, Invoice, Billing Type, Bill TO, From Address, Loading City, To Name, Track, EDI #, Booking Number, Memo | **대부분 없음** | Order 테이블에 위 컬럼들 없음. API/모델 확장 필요 |
| QTY Export | **없음** | 수량/엑셀 내보내기 없음 (CSV export는 loads에 있을 수 있음) |

---

## 5. 고객 상세 (Customer Detail)

### 참고 솔루션에 있는 것

- **탭**: General, **EDI**, **Load Setup**, **Quick View**
- General: Customer Name, Address, Country, City, **Account Type**, **Load Req**, **Login ID**, **Login C.**, Status(Active), **Upload File**
- **Contacts**: Name, Department, Email, **Add Contact**
- **Billing**: Billing Address, **Currency(CAD)**, **Credit Term**, **Expense Term**, **Discount %**, Notes, **Save POs**
- 상단: Active 토글, **+ Add New**, Save, **Done**

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| 탭 (General 등) | **부분** | PartnerDetail에 detail/locations/staff/contacts/vehicles 탭 있음. **EDI, Load Setup, Quick View** 탭 없음 |
| Account Type, Load Req, Login ID, Login C. | **없음** | 고객 전용 필드 없음 |
| Upload File | **미확인** | 파트너(고객) 첨부파일 유무 확인 |
| Contacts 테이블 | **있음** | contacts 탭에 있음 |
| Billing: Currency, Credit Term, Expense Term, Discount %, Save POs | **부분** | payment_terms 등 일부만 있을 수 있음. **Currency, Expense Term, Discount %, Save POs** 확인 필요 |
| Done 버튼 | **없음** | “Done” 네비게이션/동작 없음 |

---

## 6. 캐리어 상세 (Carrier Detail)

### 참고 솔루션에 있는 것

- **탭**: **Group**, **History**
- Carrier Info: Name, Address, Country, Province, Phone, Fax, **Postal Message**
- **Contacts**: Name, Department, Email, **Phone**, Actions, **Add Row**
- **Operation Info**: Load Confirmation Contact, **Operation Times**(MON-FRI, SAT, SUN, 24/7, BY APPT), **Timezone**, **Default Trip Type**, **Default Rate Type**, **Load Hours**, **Shift Type**, **Pickup Hours**
- **Payment Info**: Payment Terms, **Pay per Day**, **Invoice TT/ET/E-transfer**, **Other Payment Terms**, **Payment Notes**
- **Activate**, **+ New**, **Copy & Link**

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| Group / History 탭 | **없음** | 캐리어 전용 “Group/History” 탭 없음 |
| Postal Message | **없음** | 없음 |
| Operation Times, Timezone, Default Trip/Rate Type, Load/Pickup Hours, Shift Type | **없음** | 운영 시간·기본 트립/레이트 타입 등 없음 |
| Pay per Day, Invoice TT/ET/E-transfer, Other Payment Terms, Payment Notes | **부분** | payment_terms, payment_type 등 일부만 있음. 세부 필드 부족 |
| Copy & Link | **없음** | 캐리어 복제/링크 공유 없음 |

---

## 7. OS List (Order Sheet 리스트)

### 참고 솔루션에 있는 것

- 검색: **Search order type**
- 필터: **Contract type**, 날짜(2023-03-01 ~ 2023-03-01), **Status**
- **Apply / Clear**, **Export**, **Add New**
- 상태 버튼: **All List**, **Out Order**, **On Going**, **Receiving**, **Complete**
- 테이블: No, **Order Code**, **Buyer**, **Sales Rep**, **Customer PO**, **Load Date**, **Deliver Date**, **Product Name**, **Qty**, **Unit Price**, **Currency**, **Invoice**, **Tax**, **Subtotal**, **Total**, Actions(연필 등)

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| OS(Order Sheet) 전용 리스트 | **없음** | “OS List”라는 별도 엔티티/화면 없음. Order와 동일시할지, 별도 모델로 둘지 결정 필요 |
| Contract type, Order Code, Buyer, Sales Rep, Customer PO, Load/Deliver Date, Product Name, Qty, Unit Price, Invoice, Tax, Subtotal, Total | **대부분 없음** | Order 리스트에 위 컬럼들이 없음. OS를 Order와 통합할 경우 Order 확장 필요 |

---

## 8. Order (Dispatch) 리스트 – 고급 필터·컬럼

### 참고 솔루션에 있는 것

- 필터: **Load#(2종)**, **Est. Pickup/Delivery Time**, **Select role**, Filter 드롭다운, **Apply**, **Clear**, **Add**
- 상태 뱃지: Pending, Unassigned, On Hold, **Good To Go**, Assigned, In Transit, Delivered, **Exception**, Cancel
- 테이블 컬럼: Load #, Status, **Weight**, Created, Customer, **Pickup Carrier**, **Equipment**, **Pickup City, Pickup State, Pickup Date, Pickup Time**, **Dest. Port, Dest. Weight**, **Unload Date, Unload Time**, **Consolidation City, Consolidation State**, **Delivery Carrier**, **Consignee**, **Consignee City, Consignee State**, **Delivery Date, Delivery Time**, Revenue, Profit, **Created By**, **Parent**

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| Load#, Customer, From/To, 상태 탭 | **있음** | Order 페이지에 구현됨 |
| Est. Pickup/Delivery Time, Select role | **없음** | 픽업/딜리버리 기간·역할 필터 없음 |
| Good To Go, Exception | **부분** | need_to_cover 등 유사 상태 있음. **Good To Go, Exception** 명칭/값 일치 여부 확인 |
| 테이블: Load#, Status, Rate, Revenue, Cost, Created | **있음** | 컬럼 수 적음 |
| Weight, Pickup Carrier, Equipment, Pickup City/State/Date/Time, Dest. Port/Weight, Unload Date/Time, Consolidation City/State, Delivery Carrier, Consignee, Consignee City/State, Delivery Date/Time, Created By, Parent | **대부분 없음** | Order 리스트에 위 컬럼 없음. API·Load 목록 응답 확장 필요 |

---

## 9. AP List (Accounts Payable)

### 참고 솔루션에 있는 것

- **Search Load No.**, **Search Customer Name**, Customer Name·Carrier Name 드롭다운, **From/To**, **Amount 범위**
- 상태 버튼: **Unpaid**, **Paid**, **Overdue**, **Upcoming**
- 테이블: No., Status, **Updated**, Load #(링크), **Delivery**, Customer, Carrier, **Item Type**, Amount, **Balance**, Actions

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| AP 목록 (Carrier Payable) | **있음** | Invoicing viewMode="ap" |
| 검색/필터: Load No, Customer, Carrier, From/To, Amount | **부분/없음** | AR/AP 공통 필터만 있을 수 있음. **Amount 범위, Carrier** 필터 확인 필요 |
| 상태: Unpaid, Paid, Overdue, Upcoming | **부분** | overdue 등 일부만. **Upcoming** 등 상태 구분·버튼 부족 가능 |
| Updated, Delivery, Item Type, Balance | **부분** | 컬럼 구성이 참고와 다를 수 있음. **Balance, Item Type** 확인 필요 |

---

## 10. Consolidation (컨솔리데이션)

### 참고 솔루션에 있는 것

- **Search**, **SELECT DATE**(기간), Apply, Clear
- 상태: Pending, Unassigned, On Hold, **Ready to Load**, Dispatched, In Transit, Delivered, **Invoiced**, Cancelled
- **+ Add**
- 메인 테이블: LOAD #, STATUS, CUSTOMER, CARRIER, PICKUP DATE/TIME/ADDRESS/CITY/STATE/ZIP/CONTACT, DELIVERY 동일, LOAD TYPE, WEIGHT, MEASURES, ITEM COUNT, COMMODITY, REVENUE, COST, PROFIT, CREATED BY, MEMO
- 요약: Total of N, **Total Profit $**, **Total Weight**, **Total Measures**, **Total Item(s)**
- 하단 테이블: ID, **Facility**, Memo, Created By, **View Details**

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| Consolidation 페이지 | **있음** | Consolidation.tsx, API 있음 |
| 날짜 필터, 상태 필터 | **부분** | filterStatus 있음. **날짜 필터**, **Ready to Load, Invoiced** 등 상태값 확인 필요 |
| 메인 테이블 컬럼 수 | **부분** | 참고만큼 많은 컬럼(픽업/딜리버리 상세, REVENUE/COST/PROFIT 등) 없을 수 있음 |
| Total Profit $, Total Weight, Total Measures, Total Item(s) | **없음** | 하단 요약 합계 영역 없음 |
| 하단 “Facility + View Details” 테이블 | **미확인** | 컨솔리데이션 하위 테이블 구조와 일치하는지 확인 필요 |

---

## 11. Location Detail (로케이션 상세)

### 참고 솔루션에 있는 것

- **Location Name**, Location Note, **Address**, **Country**, **Province**, **City**, **Zip Code**, Email, Phone, Mobile Phone, Fax, **Remark**
- **Active** 토글, **+ Add**, **Save**, **Delete**
- **Staff**: Name, Tag, + Add, No Data
- **Contacts**: Name, Department, + Add, No Data
- **Equipment**: Name, + Add, No Data

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| Location 관리 | **있음** | PartnerDetail 내 Locations 탭, API: partners/:id/locations |
| 필드: Name, Address, City, State, Zip, Tel, Notes 등 | **부분** | 있음. **Country, Province, Email, Mobile, Fax, Remark** 등 참고와 필드 매핑 확인 필요 |
| Staff / Contacts / Equipment (로케이션 소속) | **없음** | 파트너 단위 Staff/Contacts/Vehicles는 있음. **로케이션별** Staff·Contacts·Equipment 테이블 없음 |
| Active, Delete | **부분** | is_active 등. Delete 동작 유무 확인 |

---

## 12. OSD (Overages, Shortages, Damages 등)

### 참고 솔루션에 있는 것

- **Search on Load**, Status, Amount, Customer, Shipper/Carrier, AR, AP
- **Ship Date From/To**, **Delivery Date From/To**, Apply, Clear, **Add**
- 테이블: #, Load, Date, **Ref. #**, Amount, Customer, Shipper, Carrier, **Expired Cargo**, **Company Name**, AR, AP, **Due Date**, Action(View, Delete)

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| OSD 전용 페이지/API | **없음** | EDI·Dispatch 하위에 OSD 리스트/폼 없음. 별도 모델·라우트 필요 |
| 필터·테이블 구성 | **해당 없음** | OSD 기능 없음 |

---

## 13. Profit by Customer / Expense Detail

### 참고 솔루션에 있는 것

- **Customer** 필터, **Period Date From/To**, **Period(Month 등)**, **Type**
- **Search**, **Filter by**, **View Detailed Report**
- 테이블: **Date**, **Type**, **Description**, **Account**, Customer, **Loads**, **Quantity**, Revenue, Expenses, Profit, **Margin**, Actions

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| Profit 페이지 | **있음** | 단순 Revenue/Cost/Profit 요약만 표시 |
| Profit/Expense Detail 라우트 | **있음** | /profit/expense-detail 존재. **플레이스홀더** 수준으로 보임 |
| Customer·Period·Type 필터 | **없음** | 없음 |
| Date, Type, Description, Account, Loads, Quantity, Revenue, Expenses, Profit, Margin 테이블 | **없음** | 상세 테이블·API 없음 |

---

## 14. Partner Customer 리스트 (고객 목록)

### 참고 솔루션에 있는 것

- **< Customer**(뒤로가기), **+ Add**
- 필터: **Active**, **Search...**
- 테이블: **Created**, Name, Address, **Type**, **Truck Calls**, **Payment Terms**, **Credit Limit**, Status, Action(Edit, Delete)
- 페이징

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| Partner 리스트 (Customer 필터) | **있음** | Partner.tsx, type=customer |
| Created, Name, Address, Type | **부분** | Name 등 기본만. **Created**, **Type** 컬럼 노출 확인 |
| Truck Calls, Credit Limit | **없음** | 없음 |
| Payment Terms | **부분** | 모델에 payment_terms 있을 수 있음. 목록 컬럼으로 있는지 확인 |
| Edit/Delete | **있음** | 상세로 이동·삭제 등 |

---

## 15. Permissions (권한 매트릭스)

### 참고 솔루션에 있는 것

- **Permission Name**, **Description**
- **모듈별 CRUD 매트릭스**: Create / Read / Update / Delete
  - **Dispatch**: Order, Consolidation, EDI, OSD
  - **Partner**: Customer, Staff, Carrier, Location
  - **Account**: AR, AP, Expense, Debit Credit, Item Type List
  - **Inventory**: List
  - **Setting**: User, Permission, City, Default
  - **Profit**: Customer, Expense Detail
- **Save**, Cancel

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| Permission CRUD API | **있음** | /master/permissions |
| Setting 화면에 Permission 탭 | **있음** | Setting.tsx에 permission 탭 있음 |
| **모듈/리소스별 Create·Read·Update·Delete 매트릭스 UI** | **없음** | 참고처럼 “모듈 > 하위 리소스 × CRUD” 그리드 UI 없음. 권한을 리소스·액션 단위로 지정하는 화면 없음 |

---

## 16. Debit/Credit List

### 참고 솔루션에 있는 것

- **Start Date, End Date**, **ALL** 드롭다운, **Load & Rate**, **All Account**, **Search**, Apply, Clear, **+ Add**
- 테이블: Date, **Debit/Credit**, **Credit Type**, Customer, Currency, Amount, **Paid Date**, Remark, **Staff**, Action

### 우리 솔루션 현황

| 항목 | 상태 | 갭 요약 |
|------|------|---------|
| Debit/Credit API·화면 | **있음** | Account 페이지 debitcredit 탭, /account/debit-credits |
| 필터: 기간, Load & Rate, All Account | **부분** | 기간 등 일부만 있을 수 있음. **Load & Rate, All Account** 확인 필요 |
| Credit Type, Paid Date, Staff | **부분** | 스키마에 있을 수 있음. **목록 컬럼**으로 노출 여부 확인 |
| + Add | **있음** | 추가 폼 있음 |

---

## 17. 기타 참고 이미지에서 언급된 항목

| 참고 화면 | 우리 솔루션 | 갭 요약 |
|-----------|-------------|---------|
| **Partner Staff** 리스트 | PartnerDetail 내 Staff 탭 있음 | 리스트만 있는지, “Staff 전용 목록 페이지” 필요 여부 확인 |
| **Partner Carrier** 리스트 | Partner.tsx type=carrier | 참고와 컬럼·필터 동일화 여부 확인 |
| **Partner Location** 리스트 | PartnerDetail 내 Locations 탭 | “Location 전용 목록 페이지”는 없음 (파트너 하위로만 존재) |
| **Account Item Type List** | Account itemtype 탭 | 있음. 참고와 필드·동작 일치 여부 확인 |
| **Account Expense** | Account expense 탭 | 있음. 참고와 필터·컬럼 일치 여부 확인 |
| **Inventory List / Add** | Inventory 페이지 | 있음. 참고와 warehouse/item 구조 일치 여부 확인 |
| **Setting City / City Add** | Setting city 탭 | 있음 |
| **Setting Default** | Setting default 탭 | 있음 (회사명, 로고, FSC 등) |
| **Account AR List** | Invoicing viewMode="ar" | 있음. 참고와 컬럼·상태 필터(Unpaid/Paid/Overdue/Upcoming) 비교 필요 |
| **Dispatch Order Add** | LoadDetail (order/new) | 로드 추가 폼 있음. 참고 “Active Load: New”와 필드/섹션 비교는 위 “로드/오더 폼” 참고 |
| **Partner Customer Add / Carrier Add** | PartnerDetail (new) | 있음. 참고와 필드 비교는 고객/캐리어 상세 갭 참고 |

---

## 18. 요약 – 우선 검토하면 좋은 항목

1. **대시보드**: AP 요약 블록, Top 10에 Debt/Target/%, Profit (Costs) 차트, Profit (Customers)/(Loads) 테이블 보강.
2. **로드 폼**: Waybill 타입, 다중 스탑·Billing 세그먼트, Pallet/화물 상세, Unpack/Join, Created/Modified By 노출.
3. **파트너**: API Works, Load Confirmation Email, Driver Display, Team Memberships, Service Items.
4. **고객/캐리어 상세**: EDI/Load Setup/Quick View 탭, 운영 시간·결제 세부 필드, Copy & Link.
5. **Order 리스트**: 컬럼 대폭 확장(Weight, Equipment, Pickup/Delivery/Consignee 상세, Created By, Parent 등), P.O NO/LANE ID/Bill to 필터, QTY Export.
6. **AP 리스트**: 상태 버튼(Unpaid/Paid/Overdue/Upcoming), Amount 범위·Carrier 필터, Balance/Item Type 컬럼.
7. **OS List**: OS 전용 엔티티/화면 도입 여부 및 Order와 통합 시 Order 확장.
8. **OSD**: 전용 모델·API·화면 도입.
9. **Profit by Customer / Expense Detail**: 기간·고객·타입 필터, 상세 테이블(Date, Type, Description, Account, Loads, Quantity, Revenue, Expenses, Profit, Margin), View Detailed Report.
10. **Permissions**: 모듈/리소스별 Create·Read·Update·Delete 매트릭스 UI.
11. **Location**: 로케이션별 Staff/Contacts/Equipment.
12. **Consolidation**: 하단 요약(Total Profit, Weight, Measures, Items), 필요 시 Facility·View Details 하위 테이블.

---

이 문서는 **갭 확인 및 우선순위 검토용**입니다. 수정·구현 범위는 확인 후 단계적으로 진행하시면 됩니다.

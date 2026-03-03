# A2 — Partner 확장: Location / Staff / Carrier Contacts / Carrier Vehicles

> **구현일**: 2026-03-03  
> **상태**: ✅ 완료  
> **참조 솔루션 대응**: Partner_Location, Partner_Staff, Carrier_Contacts, Carrier_Vehicles, Carrier_Detail

---

## 1. 구현 개요

파트너 상세 페이지가 탭 기반으로 재구성됨.

| 탭 | 노출 조건 | 설명 |
|----|-----------|------|
| Detail | 항상 | 기본 정보 + 캐리어 확장 필드 |
| Locations | 항상 | 파트너별 다중 위치 CRUD |
| Staff | 항상 | 파트너 소속 담당자 CRUD |
| Contacts | 캐리어만 | 캐리어 연락처 1:N |
| Vehicles | 캐리어만 | 캐리어 차량 1:N |

---

## 2. 신규 파일

| 파일 | 역할 |
|------|------|
| `backend/app/models/partner_ext.py` | SQLAlchemy 모델: PartnerLocation, PartnerStaff, CarrierContact, CarrierVehicle |
| `backend/alembic/versions/013_partner_expansion.py` | DB 마이그레이션 |
| `backend/app/api/routes/partner_ext.py` | FastAPI 라우터 (partners 하위) |

## 3. 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `backend/app/schemas/partner.py` | 확장 필드 추가 (20개+) |
| `frontend/src/pages/PartnerDetail.tsx` | 5탭 기반 전면 재작성 |

---

## 4. 데이터 모델

### 4.1 partner_locations
```
partner_locations
├── id            UUID PK
├── partner_id    UUID FK → partners (CASCADE)
├── name          VARCHAR(255)      위치명
├── address       VARCHAR(512)
├── tel           VARCHAR(50)
├── city          VARCHAR(255)
├── state         VARCHAR(100)
├── zip_code      VARCHAR(20)
├── entry_date    DATE
├── notes         TEXT
├── bill          VARCHAR(255)      [Customer 전용] 청구 코드
├── description   TEXT              [Customer 전용]
├── billing_ship_to VARCHAR(255)   [Customer 전용]
├── comments      TEXT              [Customer 전용]
├── is_active     BOOLEAN
└── created_at    DATETIME
```

### 4.2 partner_staff
```
partner_staff
├── id          UUID PK
├── partner_id  UUID FK → partners (CASCADE)
├── full_name   VARCHAR(255) NN
├── department  VARCHAR(100)
├── email       VARCHAR(255)
├── phone       VARCHAR(50)
├── title       VARCHAR(100)
├── is_active   BOOLEAN
└── created_at  DATETIME
```

### 4.3 carrier_contacts
```
carrier_contacts
├── id          UUID PK
├── partner_id  UUID FK → partners (CASCADE)
├── name        VARCHAR(255) NN
├── department  VARCHAR(100)
├── email       VARCHAR(255)
├── phone       VARCHAR(50)
└── is_primary  BOOLEAN
```

### 4.4 carrier_vehicles
```
carrier_vehicles
├── id             UUID PK
├── partner_id     UUID FK → partners (CASCADE)
├── vehicle_type   VARCHAR(100)
├── vehicle_number VARCHAR(100)
├── model          VARCHAR(100)
└── price          NUMERIC(12,2)
```

### 4.5 partners 테이블 신규 컬럼 (캐리어 확장)
```
partners
├── code                VARCHAR(50)
├── legal_name          VARCHAR(255)
├── operating_status    VARCHAR(100)
├── carrier_type        VARCHAR(100)
├── service_hours       VARCHAR(100)
├── mc_status           VARCHAR(50)
├── hazmat_carrier      BOOLEAN
├── w9_received         BOOLEAN
├── default_tax_code    VARCHAR(20)
├── payment_days        INTEGER
├── payment_type        VARCHAR(50)
├── ach_eft_banking     VARCHAR(255)
├── factor_company_name VARCHAR(255)
├── personal_message    TEXT
├── bill_to             VARCHAR(255)
└── created_at          DATETIME
```

---

## 5. API 엔드포인트

베이스 경로: `/api/v1/partners`

| Method | Path | 설명 |
|--------|------|------|
| GET | `/{id}/locations` | 위치 목록 |
| POST | `/{id}/locations` | 위치 생성 |
| PATCH | `/{id}/locations/{loc_id}` | 위치 수정 |
| DELETE | `/{id}/locations/{loc_id}` | 위치 삭제 |
| GET | `/{id}/staff` | 직원 목록 |
| POST | `/{id}/staff` | 직원 생성 |
| PATCH | `/{id}/staff/{staff_id}` | 직원 수정 |
| DELETE | `/{id}/staff/{staff_id}` | 직원 삭제 |
| GET | `/{id}/contacts` | 연락처 목록 |
| POST | `/{id}/contacts` | 연락처 생성 |
| DELETE | `/{id}/contacts/{contact_id}` | 연락처 삭제 |
| GET | `/{id}/vehicles` | 차량 목록 |
| POST | `/{id}/vehicles` | 차량 생성 |
| PATCH | `/{id}/vehicles/{vehicle_id}` | 차량 수정 |
| DELETE | `/{id}/vehicles/{vehicle_id}` | 차량 삭제 |

---

## 6. 주요 설계 결정

- **Location Customer 필드**: bill, description, billing_ship_to, comments는 Customer 타입 파트너에만 UI 노출
- **Contacts/Vehicles 탭**: form.type === 'carrier'일 때만 표시
- **partners 기본 라우터 PATCH**: 확장 필드 포함 동일 PATCH `/partners/{id}` 사용

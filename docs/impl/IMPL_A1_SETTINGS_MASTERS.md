# A1 — Settings Masters: City / Type+SubType / Permission

> **구현일**: 2026-03-03  
> **상태**: ✅ 완료  
> **참조 솔루션 대응**: Setting_Default, Setting_City, Setting_Type, Setting_Permission

---

## 1. 구현 개요

Settings 페이지에 4개 탭을 추가함.

| 탭 | 설명 |
|----|------|
| Default | 기존 회사 브랜딩·기본값·AR Reminder 설정 |
| City | 도시 마스터 CRUD (Code, Name, Province, Country, Zip, Timezone, Remarks) |
| Type / SubType | 계층형 유형 마스터 CRUD (Type + 선택적 SubType) |
| Permission | 권한 마스터 CRUD (Name, Resource, Action, Description) |

---

## 2. 신규 파일

| 파일 | 역할 |
|------|------|
| `backend/app/models/master.py` | SQLAlchemy 모델: City, TypeMaster, SubTypeMaster, Permission |
| `backend/alembic/versions/012_settings_masters.py` | DB 마이그레이션 |
| `backend/app/schemas/master.py` | Pydantic 스키마 |
| `backend/app/api/routes/master.py` | FastAPI 라우터 |
| `frontend/src/pages/Setting.tsx` | 4탭 통합 Settings 페이지 (전면 재작성) |

---

## 3. 데이터 모델

### 3.1 City
```
cities
├── id          UUID PK
├── code        VARCHAR(20)      도시 코드 (예: YVR)
├── name        VARCHAR(255) NN  도시명
├── province    VARCHAR(100)     주/도
├── country     VARCHAR(100)     국가 (기본: CANADA)
├── zip_code    VARCHAR(20)      우편번호
├── timezone    VARCHAR(100)     시간대 (예: America/Vancouver)
├── remarks     TEXT
├── is_active   BOOLEAN
└── created_at  DATETIME
```

### 3.2 TypeMaster + SubTypeMaster
```
type_masters
├── id            UUID PK
├── type_name     VARCHAR(255) NN
├── use_subtype   BOOLEAN
├── description   TEXT
├── remark        TEXT
├── is_active     BOOLEAN
└── created_at    DATETIME

subtype_masters
├── id             UUID PK
├── parent_id      UUID FK → type_masters.id (CASCADE)
├── subtype_name   VARCHAR(255) NN
└── is_active      BOOLEAN
```

### 3.3 Permission
```
permissions
├── id           UUID PK
├── name         VARCHAR(255) UNIQUE NN
├── description  TEXT
├── resource     VARCHAR(100)  리소스 (예: loads, partners)
├── action       VARCHAR(50)   동작 (예: read, write, delete)
├── is_active    BOOLEAN
└── created_at   DATETIME
```

---

## 4. API 엔드포인트

베이스 경로: `/api/v1/master`

| Method | Path | 설명 |
|--------|------|------|
| GET | `/cities` | 목록 (`q`, `active_only` 필터) |
| GET | `/cities/{id}` | 단건 조회 |
| POST | `/cities` | 생성 |
| PATCH | `/cities/{id}` | 수정 |
| DELETE | `/cities/{id}` | 삭제 |
| GET | `/types` | 유형 목록 (+subtypes 포함) |
| POST | `/types` | 유형 생성 (subtypes 배열 동시 생성) |
| PATCH | `/types/{id}` | 유형 수정 |
| DELETE | `/types/{id}` | 유형 삭제 (cascade) |
| POST | `/types/{id}/subtypes` | 서브타입 추가 |
| DELETE | `/subtypes/{id}` | 서브타입 삭제 |
| GET | `/permissions` | 권한 목록 |
| POST | `/permissions` | 권한 생성 (이름 중복 409) |
| PATCH | `/permissions/{id}` | 권한 수정 |
| DELETE | `/permissions/{id}` | 권한 삭제 |

---

## 5. 프론트엔드 구조

```
Setting.tsx
├── DefaultSettingTab   — 기존 설정값 (회사·AR Reminder·SMTP Test)
├── CityTab             — 도시 목록·검색·모달 추가/수정/삭제
├── TypeTab             — 유형 목록·서브타입 인라인 관리
└── PermissionTab       — 권한 목록·검색·모달 추가/수정/삭제
```

- 각 탭은 마운트 시 API 호출 → 로컬 state 관리
- 추가/수정은 Modal 컴포넌트 공유 (z-50 오버레이)
- 삭제는 confirm 후 즉시 반영

---

## 6. 마이그레이션

```bash
# 서버에서 실행
cd /home/john/freight-broker/backend
source .venv/bin/activate
alembic upgrade head
# → 012_settings_masters 적용
```

---

## 7. 주요 설계 결정

- **TypeMaster.use_subtype**: false면 서브타입 UI가 숨겨져 단순 유형으로만 사용
- **Permission**: 이름 unique 제약 → 409 Conflict 반환으로 중복 방지
- **City.timezone**: `America/Vancouver` 형식 자유 입력 (IANA 표준 권장)
- **SubType 삭제**: 독립 엔드포인트 `/master/subtypes/{id}` 사용 (프론트에서 인라인 × 버튼)

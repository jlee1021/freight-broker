# 모의 운영 테스트 가이드

테스트 데이터를 DB에 넣고, API를 순서대로 호출해 **실제 솔루션 운영**을 시뮬레이션합니다. PDF 다운로드(LC, 인보이스) 포함.

---

## 0단계: DB 마이그레이션 (서버 배포 시)

코드 배포 후 **한 번** 실행해 DB 스키마를 최신(009 등)으로 맞춥니다. PostgreSQL이 떠 있고 `DATABASE_URL`이 설정된 환경에서 실행하세요.

### Ubuntu 서버에서

```bash
cd ~/freight-broker/backend
source .venv/bin/activate
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/freight_broker"   # 실제 DB 주소로 변경
export PYTHONPATH=.
python scripts/run_migrate.py
```

성공 시 `Migration completed: upgrade head` 가 출력됩니다. 실패하면 `DATABASE_URL`과 PostgreSQL 연결을 확인하세요.

### Windows (로컬)

```cmd
cd C:\path\to\freight-broker\backend
.venv\Scripts\activate
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/freight_broker
set PYTHONPATH=.
python scripts/run_migrate.py
```

---

## 사전 준비

- **백엔드 서버**가 떠 있어야 합니다. (배포 후라면 이미 `uvicorn`이 동작 중)
- **DB**가 떠 있어야 합니다. (Docker: `docker ps` 에 `freight-broker-db` 확인)
- 스크립트는 **백엔드 가상환경(.venv)** 에서 실행해야 합니다. (시스템 `python3`에는 sqlalchemy 등이 없음)

---

## 1단계: 테스트 데이터 시드

DB에 모의용 사용자·파트너·로드·인보이스를 넣습니다.

### Ubuntu 서버에서 (복사해서 그대로 실행)

```bash
# 1) backend 폴더로 이동
cd ~/freight-broker/backend

# 2) 가상환경 활성화 (필수! 여기서 pip 패키지가 설치되어 있음)
source .venv/bin/activate

# 3) DB 주소 설정 (이 서버에서 Docker DB 쓰는 경우 포트 5433)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/freight_broker"

# 4) Python이 app 폴더를 찾을 수 있도록
export PYTHONPATH=.

# 5) 시드 스크립트 실행
python scripts/seed_test_data.py
```

**한 번에 복사해서 쓸 수 있는 블록:**

```bash
cd ~/freight-broker/backend && source .venv/bin/activate && \
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/freight_broker" && \
export PYTHONPATH=. && \
python scripts/seed_test_data.py
```

### 예상 출력

```
Users: admin@test.com / dispatcher@test.com (password: test1234)
Partners: 2 customers, 2 carriers
Loads: MOCK-1001, MOCK-1002, MOCK-1003 (with shipper/consignee/carrier)
Invoices: customer + carrier payables for test loads
Seed done. Use admin@test.com / test1234 or dispatcher@test.com / test1234 for mock run.
```

이미 데이터가 있으면 `User already exists`, `Load list (empty...)` 같은 메시지가 나올 수 있으며, 그대로 두면 됩니다.

### Windows (로컬 PC)에서

```cmd
cd C:\Users\jonghun.lee\freight-broker\backend
.venv\Scripts\activate
set PYTHONPATH=.
python scripts/seed_test_data.py
```

(로컬에서 DB 포트가 다르면 `set DATABASE_URL=...` 로 맞춰 주세요.)

---

## 2단계: 모의 운영 스크립트 실행

API를 순서대로 호출해 로그인·대시보드·로드·문서 PDF·인보이스 PDF·권한(403)까지 검증합니다.

### Ubuntu 서버에서 (백엔드 서버가 떠 있는 상태에서)

```bash
# 1) backend 폴더로 이동
cd ~/freight-broker/backend

# 2) 가상환경 활성화
source .venv/bin/activate

# 3) PYTHONPATH 설정
export PYTHONPATH=.

# 4) 모의 운영 실행 (같은 서버에서 돌리면 기본값 localhost:8000)
python scripts/run_mock_operation.py
```

**다른 서버에서 백엔드를 호출할 때** (예: PC에서 192.168.111.137 백엔드 검증):

```bash
python scripts/run_mock_operation.py --base-url http://192.168.111.137:8000
```

**한 번에 복사해서 쓸 수 있는 블록 (Ubuntu, 같은 서버):**

```bash
cd ~/freight-broker/backend && source .venv/bin/activate && \
export PYTHONPATH=. && \
python scripts/run_mock_operation.py
```

### 예상 출력

```
=== 모의 운영 테스트 (PDF 포함) ===

1. 로그인 (admin@test.com)
  [OK] Admin login
2. GET /auth/me
  [OK] Me: admin@test.com role=admin
3. GET /stats/dashboard
  [OK] Dashboard: loads=3 revenue=...
...
7. GET /documents/load/{id}/lc/pdf (PDF)
  [OK] LC PDF size=xxxx bytes
...
9. GET /invoices/customer/{id}/document/pdf
  [OK] Invoice PDF size=xxxx bytes
...
11. Dispatcher login → GET /users (expect 403)
  [OK] Dispatcher correctly got 403 on /users

=== 모의 운영 테스트 완료 (모든 단계 통과) ===
```

PDF가 503이면 weasyprint 미설치로 해당 단계만 스킵되고, 나머지는 그대로 통과합니다.

---

## 생성되는 테스트 데이터 요약

| 항목 | 내용 |
|------|------|
| 사용자 | `admin@test.com` / `dispatcher@test.com` (비밀번호: `test1234`) |
| 파트너 | 고객 2명, 캐리어 2명 |
| 로드 | MOCK-1001, MOCK-1002, MOCK-1003 (shipper/consignee/carrier segment 포함) |
| 인보이스 | 고객 인보이스·캐리어 페이어블 각 2건 |

---

## 자주 나오는 오류와 해결

| 오류 | 원인 | 해결 |
|------|------|------|
| `Command 'python' not found` | Ubuntu에 `python` 심볼릭 링크 없음 | `python3` 대신 **가상환경 활성화 후** `python` 사용. 또는 `python3 scripts/...` (가상환경 안에서) |
| `ModuleNotFoundError: No module named 'sqlalchemy'` | 시스템 Python으로 실행함 (패키지 없음) | **반드시** `cd ~/freight-broker/backend` 후 `source .venv/bin/activate` 하고 나서 스크립트 실행 |
| `connection refused` / DB 오류 | DB가 안 떠 있거나 주소/포트 다름 | `docker ps`로 DB 확인. 포트 5433이면 `export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/freight_broker"` |
| `HTTP 401` (모의 운영에서) | 테스트 사용자 없음 | 1단계 시드를 먼저 실행 (`scripts/seed_test_data.py`) |
| `HTTP 503` (PDF 단계) | weasyprint 미설치 | 서버에 weasyprint 의존성 설치 후 `pip install weasyprint`. 없으면 해당 단계만 스킵되고 나머지는 통과 |

---

## 검증 단계 요약 (모의 운영 스크립트)

1. Admin 로그인  
2. GET /auth/me  
3. GET /stats/dashboard  
4. GET /loads  
5. GET /loads/{id}  
6. GET /documents/load/{id}/lc (HTML)  
7. **GET /documents/load/{id}/lc/pdf** (PDF)  
8. GET /invoices/customer, /invoices/carrier  
9. **GET /invoices/customer/{id}/document/pdf**  
10. GET /settings  
11. Dispatcher 로그인 → GET /users → **403** 확인  

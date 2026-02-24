# FreightBroker Pro — 관리자 운영 매뉴얼

> 대상: 시스템 관리자 (Admin 역할 보유자)

---

## 목차

1. [관리자 계정 최초 설정](#1-관리자-계정-최초-설정)
2. [사용자 계정 관리](#2-사용자-계정-관리)
3. [역할(Role) 권한 체계](#3-역할role-권한-체계)
4. [포털 계정 발급](#4-포털-계정-발급)
5. [시스템 설정 (Settings)](#5-시스템-설정-settings)
6. [이메일 연동 설정](#6-이메일-연동-설정)
7. [데이터베이스 관리](#7-데이터베이스-관리)
8. [서버 운영 관리](#8-서버-운영-관리)
9. [백업 및 복구](#9-백업-및-복구)
10. [트러블슈팅](#10-트러블슈팅)
11. [API 관리](#11-api-관리)

---

## 1. 관리자 계정 최초 설정

### 기본 계정 정보

시스템 최초 기동 시 아래 계정이 자동 생성됩니다.

| 항목 | 값 |
|------|-----|
| 이메일 | `admin@local` |
| 비밀번호 | `admin123` |
| 역할 | `admin` |

### 비밀번호 변경 (최초 로그인 후 필수)

1. 로그인 후 좌측 메뉴 **Account** 클릭
2. 관리자 계정 행의 **Edit** 클릭
3. **New Password** 입력 후 **Save** 클릭

> 보안을 위해 비밀번호는 영문·숫자·특수문자 조합 12자리 이상을 권장합니다.

---

## 2. 사용자 계정 관리

좌측 메뉴 **Account**를 클릭합니다. (Admin 역할만 접근 가능)

### 사용자 목록 조회

현재 등록된 모든 사용자가 표시됩니다.

| 컬럼 | 내용 |
|------|------|
| Email | 로그인 이메일 |
| Name | 표시 이름 |
| Role | 역할 |
| Portal (Partner) | 포털 연결 파트너 (일반 사용자는 `-`) |

### 신규 사용자 생성

1. **Add User** 버튼 클릭
2. 아래 정보 입력:

| 필드 | 설명 | 필수 |
|------|------|:----:|
| Email | 로그인 이메일 (고유값) | ✓ |
| Full Name | 표시 이름 | |
| Role | 역할 선택 | ✓ |
| Password | 초기 비밀번호 | ✓ |
| Portal Partner | 포털 사용자의 경우 연결 파트너 선택 | |

3. **Save** 클릭

### 사용자 정보 수정

1. 수정할 사용자 행의 **Edit** 클릭
2. 정보 변경 후 **Save** 클릭
3. 비밀번호 변경이 필요한 경우 **New Password** 필드 입력 (비워두면 기존 비밀번호 유지)

> 이메일은 수정 불가합니다. 이메일 변경이 필요한 경우 기존 계정 삭제 후 재생성하십시오.

---

## 3. 역할(Role) 권한 체계

### 역할 종류

| 역할 | 코드 | 설명 |
|------|------|------|
| 관리자 | `admin` | 모든 기능 접근 가능. 계정 관리 권한 보유 |
| 디스패처 | `dispatcher` | 화물 생성/수정, 캐리어 배정 |
| 영업 | `sales` | 화물 및 고객 관리, 보고서 조회 |
| 청구 | `billing` | 인보이싱, 정산 관리 |

### 역할별 접근 가능 메뉴

| 메뉴 | admin | dispatcher | sales | billing |
|------|:-----:|:----------:|:-----:|:-------:|
| 대시보드 | ✓ | ✓ | ✓ | ✓ |
| Order (화물) | ✓ | ✓ | ✓ | ✓ |
| Partner | ✓ | ✓ | ✓ | ✓ |
| Invoicing | ✓ | - | - | ✓ |
| Profit | ✓ | - | ✓ | ✓ |
| Reports | ✓ | - | ✓ | ✓ |
| Inventory | ✓ | ✓ | - | - |
| Settings | ✓ | - | - | - |
| Account | ✓ | - | - | - |

---

## 4. 포털 계정 발급

고객사 또는 캐리어가 시스템에 직접 접속하여 자신의 정보를 조회할 수 있도록 포털 계정을 발급합니다.

### 사전 조건

해당 고객사 또는 캐리어가 **Partner** 메뉴에 등록되어 있어야 합니다.

### 발급 절차

1. **Account** 메뉴 → **Add User** 클릭
2. 정보 입력:
   - **Email**: 고객/캐리어 담당자 이메일
   - **Full Name**: 담당자 이름
   - **Role**: `dispatcher` (포털 사용자에게는 최소 권한 역할 부여)
   - **Password**: 초기 비밀번호 (담당자에게 안전하게 전달)
   - **Portal Partner**: 해당 파트너 선택 ← **핵심**
3. **Save** 클릭

### 포털 계정 동작 방식

- `Portal Partner`가 설정된 계정은 자동으로 포털 모드로 작동합니다.
- **고객 포털**: 해당 고객으로 등록된 화물 및 인보이스만 조회 가능
- **캐리어 포털**: 해당 캐리어가 배정된 화물 및 Payable만 조회 가능
- 파트너 목록, 보고서, 설정 등 내부 메뉴 접근 차단

---

## 5. 시스템 설정 (Settings)

좌측 메뉴 **Settings**를 클릭합니다. (Admin 전용)

### 회사 브랜딩

| 설정 항목 | 설명 | 사용처 |
|-----------|------|--------|
| Company Name | 회사명 | 모든 문서 헤더 |
| Company Logo URL | 로고 이미지 URL | 모든 문서 헤더 |
| Company Address | 회사 주소 | 인보이스 |
| Company MC # | MC 번호 | Rate Confirmation |
| Company DOT # | DOT 번호 | Rate Confirmation |

> **로고 설정 방법**: 로고 이미지를 공개 URL에 업로드(또는 서버에 저장)하고 URL을 입력합니다.

### 기본값 설정

| 설정 항목 | 설명 |
|-----------|------|
| Default Tax Code | 신규 화물 생성 시 기본 세금 코드 (GST / Exempted) |
| Default FSC % | 신규 화물의 기본 유류할증료 비율 |
| Default Equipment Types | 화물 생성 시 드롭다운에 표시할 장비 유형 목록 (쉼표로 구분) |

### 설정 저장

변경 후 **Save Settings** 버튼 클릭 → 즉시 적용됩니다.

---

## 6. 이메일 연동 설정

문서 발송 및 리마인더 이메일 기능을 사용하려면 서버의 `.env` 파일에 SMTP 정보를 설정해야 합니다.

### .env 파일 수정 (서버)

```bash
# SSH로 서버 접속 후
nano /home/john/freight-broker/backend/.env
```

아래 항목을 입력합니다:

```env
SMTP_HOST=smtp.office365.com       # SMTP 서버 주소
SMTP_PORT=587                       # 포트 (TLS: 587, SSL: 465)
SMTP_USER=noreply@yourcompany.com   # SMTP 계정
SMTP_PASSWORD=your_smtp_password    # SMTP 비밀번호
FROM_EMAIL=noreply@yourcompany.com  # 발신 이메일
```

### 주요 SMTP 설정 예시

**Office 365 / Microsoft 365**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your@company.com
SMTP_PASSWORD=your_password
```

**Gmail**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=앱비밀번호   # Google 앱 비밀번호 사용 필요
```

### SMTP 연결 테스트

1. Settings 페이지 하단 **Test Email** 섹션
2. 테스트 수신 이메일 입력
3. **Send Test** 클릭
4. 이메일 수신 확인

---

## 7. 데이터베이스 관리

### DB 접속 정보

| 항목 | 기본값 |
|------|--------|
| Host | localhost (Docker 컨테이너) |
| Port | 5432 |
| Database | freight_broker |
| User | postgres |
| Password | .env의 DATABASE_URL 참조 |

### DB 컨테이너 상태 확인

```bash
cd /home/john/freight-broker
docker compose ps
```

### DB 수동 접속

```bash
docker compose exec db psql -U postgres -d freight_broker
```

### 주요 테이블 목록

| 테이블 | 설명 |
|--------|------|
| `loads` | 화물 데이터 |
| `shipper_stops` | 발송지 정보 |
| `consignee_stops` | 수신지 정보 |
| `carrier_segments` | 캐리어 구간 |
| `partners` | 파트너(고객/캐리어) |
| `customer_invoices` | 고객 인보이스 (AR) |
| `carrier_payables` | 캐리어 지급 (AP) |
| `users` | 사용자 계정 |
| `settings` | 시스템 설정 |
| `warehouses` | 창고 |
| `inventory_items` | 재고 항목 |
| `load_notes` | 화물 노트 |
| `load_attachments` | 첨부 파일 메타데이터 |
| `alembic_version` | DB 마이그레이션 버전 |

### 마이그레이션 실행

코드 업데이트 후 DB 구조 변경이 있는 경우:

```bash
cd /home/john/freight-broker/backend
source .venv/bin/activate
alembic upgrade head
```

---

## 8. 서버 운영 관리

### 서비스 상태 확인

```bash
# 백엔드 상태
ps aux | grep uvicorn

# 프론트엔드 상태
ps aux | grep node

# DB 상태
docker compose ps
```

### 서비스 재시작

```bash
cd /home/john/freight-broker
chmod +x restart_services.sh
./restart_services.sh
```

또는 로컬 PC에서:

```powershell
cd C:\Users\jonghun.lee\freight-broker
python deploy_to_ubuntu.py
```

### 로그 확인

```bash
# 백엔드 로그 (실시간)
tail -f ~/backend.log

# 프론트엔드 로그
tail -f ~/frontend.log

# 최근 50줄만
tail -50 ~/backend.log
```

### 포트 정보

| 서비스 | 포트 | 설명 |
|--------|------|------|
| 프론트엔드 | 5173 | 사용자 접속 |
| 백엔드 API | 8000 | FastAPI 서버 |
| PostgreSQL | 5432 | DB (Docker) |
| API 문서 | 8000/docs | Swagger UI |

---

## 9. 백업 및 복구

### 데이터베이스 백업

```bash
# 백업 파일 생성
docker compose exec db pg_dump -U postgres freight_broker > backup_$(date +%Y%m%d_%H%M%S).sql

# 압축 백업
docker compose exec db pg_dump -U postgres freight_broker | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 데이터베이스 복구

```bash
# 복구 (DB 재생성 후)
cat backup_20240101.sql | docker compose exec -T db psql -U postgres -d freight_broker
```

### 첨부 파일 백업

```bash
# 업로드 파일 디렉토리
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /home/john/freight-broker/uploads/
```

### 정기 백업 자동화 (권장)

```bash
# crontab 편집
crontab -e

# 매일 새벽 2시 백업 추가
0 2 * * * cd /home/john/freight-broker && docker compose exec -T db pg_dump -U postgres freight_broker > ~/backups/backup_$(date +\%Y\%m\%d).sql
```

---

## 10. 트러블슈팅

### 문제: 백엔드 서버가 응답하지 않음

```bash
# 프로세스 확인
ps aux | grep uvicorn

# 수동 재시작
cd /home/john/freight-broker/backend
source .venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/backend.log 2>&1 &
```

### 문제: 프론트엔드 접속 불가

```bash
# 포트 사용 확인
lsof -i :5173

# 프로세스 강제 종료 후 재시작
kill -9 $(lsof -ti:5173)
cd /home/john/freight-broker/frontend
nohup npm run dev > ~/frontend.log 2>&1 &
```

### 문제: DB 연결 오류

```bash
# DB 컨테이너 재시작
docker compose restart db

# DB 로그 확인
docker compose logs db
```

### 문제: 로그인 불가 (JWT 오류)

```bash
# .env 파일의 SECRET_KEY 확인
cat /home/john/freight-broker/backend/.env | grep SECRET_KEY

# 백엔드 재시작
pkill -9 -f uvicorn
# (이후 위 수동 재시작 명령어 실행)
```

### 문제: 파일 업로드 실패

```bash
# 업로드 디렉토리 권한 확인
ls -la /home/john/freight-broker/uploads/

# 권한 수정
chmod -R 755 /home/john/freight-broker/uploads/
```

### 문제: 이메일 발송 실패

1. Settings → Test Email 기능으로 SMTP 연결 테스트
2. 백엔드 로그에서 오류 메시지 확인: `tail -50 ~/backend.log`
3. `.env`의 SMTP 설정 재확인
4. 방화벽에서 587 포트 허용 여부 확인

---

## 11. API 관리

### Swagger UI 접속

```
http://서버주소:8000/docs
```

모든 API 엔드포인트를 브라우저에서 직접 테스트할 수 있습니다.

### API 인증

모든 API는 JWT Bearer 토큰 인증이 필요합니다.

**토큰 발급:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin@local",
  "password": "admin123"
}
```

응답의 `access_token`을 이후 요청의 `Authorization: Bearer {token}` 헤더에 포함합니다.

### 주요 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/v1/auth/login` | POST | 로그인 |
| `/api/v1/auth/me` | GET | 현재 사용자 정보 |
| `/api/v1/loads` | GET/POST | 화물 목록/생성 |
| `/api/v1/loads/{id}` | GET/PATCH/PUT | 화물 상세/수정 |
| `/api/v1/partners` | GET/POST | 파트너 목록/생성 |
| `/api/v1/invoices/customer` | GET/POST | AR 목록/생성 |
| `/api/v1/stats/dashboard` | GET | 대시보드 통계 |
| `/api/v1/settings` | GET/PUT | 설정 조회/저장 |
| `/api/v1/users` | GET/POST | 사용자 목록/생성 |

---

## 보안 체크리스트

시스템 운영 시 다음 항목을 정기적으로 점검하십시오.

- [ ] 기본 관리자 비밀번호 변경 완료
- [ ] `.env` 파일의 `SECRET_KEY`가 강력한 무작위 문자열인지 확인
- [ ] 불필요한 계정 비활성화 또는 삭제
- [ ] 정기 DB 백업 수행 (권장: 매일)
- [ ] 서버 방화벽에서 8000 포트(API)는 내부망 전용으로 제한
- [ ] SSL/TLS 인증서 설치 (외부 공개 시 필수)
- [ ] 캐리어 보험 만료 알림 주간 확인

---

*관리자 문의: 시스템 공급사에 연락하십시오.*

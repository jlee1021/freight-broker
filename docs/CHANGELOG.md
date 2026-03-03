# Changelog — FreightBroker Pro

모든 주요 변경 사항을 이 파일에 기록합니다.  
형식: [Semantic Versioning](https://semver.org/) 준수

---

## [2.0.0] — 2026-02-26 (현재 버전)

### 추가된 기능

#### B-1: AR 인보이스 리마인더 자동화
- **백엔드**: APScheduler 기반 매일 08:00 자동 실행 스케줄러 탑재
- **백엔드**: `services/reminder.py` — 연체 인보이스 이메일 발송 서비스
- **DB 마이그레이션 011**: `customer_invoices`에 `last_reminder_sent_at`, `reminder_sent_count` 컬럼 추가
- **설정 API 확장**: `ar_reminder_days`(기준일), `ar_reminder_repeat_days`(반복 간격) 추가
- **Settings 페이지**: 리마인더 설정 UI — 기준일/반복 간격 입력, "지금 즉시 실행" 버튼
- **Invoicing 페이지**: "Last Reminder" 컬럼 추가 — 마지막 발송일과 총 발송 횟수 표시
- **리마인더 수동 실행 API**: `POST /api/v1/settings/run-reminder`

#### B-3: 포털 UI 고도화
- **신규 페이지**: `PortalDashboard.tsx` — 고객/캐리어 포털 전용 대시보드
  - 웰컴 배너 (파트너명, 날짜)
  - KPI 카드 (활성 로드, 미결 인보이스/페이어블, 연체 건수)
  - 최근 로드 목록 (상태별 색상 뱃지)
  - 최근 인보이스 / 페이어블 요약
  - 캐리어 포털: "Tender 이메일을 확인하세요" 안내 박스
- **App.tsx**: 포털 사용자 로그인 시 `PortalDashboard`로 자동 라우팅
- **사이드바 개선**: 포털/관리자 구분 표시, 캐리어 포털 시 "My Payables" 메뉴 표시

#### B-4: Tender 워크플로우
- **DB 마이그레이션 011**: `tenders` 테이블 신규 생성
  - 필드: `load_id`, `carrier_id`, `status`, `message`, `token`, `rate_offered`, `reject_reason`, `sent_at`, `responded_at`
- **백엔드 모델**: `app/models/tender.py` — Tender ORM 모델
- **백엔드 API** (`/api/v1/loads/{load_id}/tenders`):
  - `GET` — 해당 로드의 Tender 목록
  - `POST` — Tender 생성 + 캐리어 이메일 자동 발송
  - `DELETE /{tender_id}` — Tender 취소
- **공개 응답 URL** (`/api/v1/tenders/respond/{token}/accept|reject`):
  - 인증 불필요, 이메일 링크 클릭만으로 수락/거절
  - 결과 페이지 (HTML) 렌더링
- **프론트엔드**: LoadDetail에 "Tender to Carrier" 섹션 추가
  - 발송 이력 테이블 (상태 배지: pending/sent/accepted/rejected/cancelled)
  - "+ Send Tender" 모달 (캐리어 선택, 제안 운임, 메시지)
  - Cancel 버튼

#### A: 품질 보증
- **check_health.py**: API 자동 헬스체크 스크립트 (17개 엔드포인트 검증)
- **VM 보안 강화**: SECRET_KEY 교체 (64바이트 랜덤), CORS_ORIGINS 확정

#### C: 비즈니스 준비
- **CLOUDFLARE_TUNNEL.md**: 무료 공개 URL 설정 완전 가이드
- `requirements.txt`에 `apscheduler>=3.10.0` 추가

---

## [1.5.0] — 2026-02-23 (P0 보안 패치 + 문서화)

### 수정된 버그
- `Dashboard.tsx`: TypeScript 빌드 오류 — optional 필드 nullish coalescing (`?? 0`) 처리
- `Reports.tsx`: 미사용 `buildUrl` import 제거 → 빌드 통과
- `security.py`: `datetime.utcnow()` → `datetime.now(timezone.utc)` 교체 (Python 3.12 deprecation)
- `load_notes.py`: `n.user` None 체크 누락 수정
- `main.py`: 시작 시 seed 예외 `pass` → `logger.warning()` 교체

### 보안 강화
- `config.py`: `SECRET_KEY` 기본값 감지 로직 (`is_secret_key_insecure` property)
- `main.py`: 인시큐어 SECRET_KEY 경고 로그
- `config.py`: 토큰 만료 7일 → 8시간
- `config.py`: CORS_ORIGINS 하드코딩 IP 제거

### 추가된 파일
- `docs/README.md` — 제품 소개
- `docs/USER_MANUAL.md` — 사용자 운영 매뉴얼
- `docs/ADMIN_MANUAL.md` — 관리자 운영 매뉴얼
- `docs/TEST_MANUAL.md` — 테스트 스크립트 및 매뉴얼
- `docs/INSTALL.md` — 설치 및 배포 가이드
- `docs/ROADMAP.md` — 제품 로드맵
- `.gitignore` — Git 제외 파일 설정
- `.env.example` — 환경 변수 템플릿

---

## [1.4.0] — 2026-02-22 (코드 리뷰 개선)

### 수정된 버그
- `Order.tsx`: 중복 `<h1>` 태그 제거
- `Account.tsx`: 테이블 헤더/데이터 컬럼 불일치 수정 (colSpan 4→5, Portal 컬럼 추가)
- `App.tsx`: `PageErrorBoundary.componentDidCatch` 로직 수정
- `loads.py`: `_recompute_load_financials` N+1 쿼리 개선, `db.commit/refresh` 순서 수정
- `load_attachments.py`: 파일 업로드 보안 강화 (크기 제한 20MB, 허용 확장자, 경로 순회 방지)
- `documents.py`: XSS 방지 (`html.escape()` 적용)

---

## [1.3.0] — 2026-02-21 (테스트 데이터 + 배포 개선)

### 추가
- 테스트 데이터 생성 스크립트 (`generate_test_data.py`)
- 대용량 테스트 데이터: 파트너 40개, 로드 43개, 인보이스 15개+

### 수정
- VM 다중 Vite 프로세스 문제 해결 (`pkill -9` 적용)
- `restart_services.sh` CRLF → LF 수정 (`.gitattributes` 추가)

---

## [1.2.0] — 2026-02-20 (기능 추가)

### 추가
- Load Notes 기능 (`/loads/{id}/notes`)
- SQLAlchemy 관계 누락 수정 (`LoadNote` 모델 연결)
- 포털 사용자 (partner_id 기반) 데이터 필터링
- 캐리어 Rating/On-time 필드

---

## [1.1.0] — 2026-02-19 (안정화)

### 수정
- CORS 설정 수정 (allow_credentials + allow_origins 충돌)
- Blank page 버그 수정 (Dashboard, Profit, Reports, Setting, Inventory)
- `PageErrorBoundary` 추가 (App.tsx)
- API 422 오류 수정 (`limit` 파라미터 2000으로 확장)

---

## [1.0.0] — 2026-02-18 (최초 릴리즈)

### 초기 기능
- Load CRUD (shipper/consignee stops, carrier segments, references)
- Partner 관리 (고객/캐리어, MC/DOT/보험)
- AR/AP 인보이싱
- 대시보드 KPI
- Profit 분석
- 리포트 (Revenue/Lane/Carrier Performance)
- 인벤토리 관리
- 문서 생성 (Rate Confirmation, BOL, Load Confirmation, Pallet Tag)
- 파일 첨부
- 사용자/권한 관리
- 시스템 설정

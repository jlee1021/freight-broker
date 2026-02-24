# FreightBroker Pro — 제품 소개서

> **화물 중개업 전용 통합 운영 관리 시스템**

---

## 제품 개요

FreightBroker Pro는 화물 중개 업체(Freight Broker)가 화물 운송 전 과정을 하나의 플랫폼에서 관리할 수 있도록 설계된 웹 기반 ERP 솔루션입니다.

견적에서 배차, 인보이스 발행, 수금·지급 정산, 수익 분석까지 — 일상 업무의 모든 흐름을 자동화합니다.

---

## 핵심 기능

### 1. 화물 관리 (Load Management)
- 로드(화물 건) 생성 · 수정 · 상태 추적
- 발송지(Shipper) / 수신지(Consignee) / 캐리어 구간 다중 등록
- 8단계 상태 관리 (Pending → Delivered)
- 일괄 상태 변경 (다중 선택)

### 2. 재무 자동 계산
- 요금(Rate) + FSC + 기타요금 → 수익(Revenue) 자동 계산
- 캐리어 구간 합산 → 비용(Cost) 자동 계산
- 이익률(Profit %) · GST · 총액(Total with GST) 실시간 표시

### 3. 문서 자동 생성
| 문서 | 형식 |
|------|------|
| Load Confirmation (LC) | HTML · PDF |
| Rate Confirmation | HTML · PDF |
| Bill of Lading (BOL) | HTML · PDF |
| Pallet Tag | HTML · PDF |
| Customer Invoice | HTML · PDF |
| Carrier Payable | HTML · PDF |

### 4. 파트너 관리
- 고객(Customer) · 캐리어(Carrier) 통합 관리
- 캐리어 보험 만료일 추적 및 알림
- MC번호 · DOT번호 등 컴플라이언스 정보 관리

### 5. 인보이싱 & 정산
- AR(매출채권): 고객 인보이스 발행 · 상태 추적 (Draft → Sent → Paid)
- AP(매입채무): 캐리어 지급 관리 (Draft → Paid)
- 연체 필터링 및 알림

### 6. 분석 & 보고서
- 실시간 대시보드 (매출 · 비용 · 이익 · 미수금)
- 고객별 · 캐리어별 수익 리포트
- 레인(출발지-목적지)별 분석
- 캐리어 성과 리포트 (정시율 · 평점)
- CSV 데이터 내보내기 (로드, AR, AP)

### 7. 고객 · 캐리어 포털
- 외부 접근용 별도 포털 계정 발급
- 고객: 자신의 화물 현황 · 인보이스 조회
- 캐리어: 배정된 화물 · 지급 현황 조회

### 8. 재고 관리
- 창고 등록 및 재고 항목(SKU) 관리
- 수량 실시간 추적

### 9. 이메일 발송
- 문서(LC, BOL, 인보이스 등) 이메일 발송
- SMTP 연동 (Office365, Gmail 등)

### 10. 시스템 설정
- 회사 브랜딩 (로고 · 회사명 · 주소)
- 기본값 설정 (세금 코드, FSC%, 장비 유형)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 18, TypeScript, Vite, Tailwind CSS |
| 백엔드 | FastAPI (Python 3.11+) |
| 데이터베이스 | PostgreSQL 15 |
| ORM | SQLAlchemy 2.x |
| 인증 | JWT (jose) + bcrypt |
| 마이그레이션 | Alembic |
| 컨테이너 | Docker Compose (DB) |
| PDF 생성 | WeasyPrint |

---

## 시스템 요구사항

### 서버 (권장)
- OS: Ubuntu 22.04 LTS
- CPU: 2 Core 이상
- RAM: 4GB 이상
- 저장공간: 50GB 이상
- Python 3.11+, Node.js 18+, Docker

### 클라이언트
- Chrome, Firefox, Edge, Safari (최신 버전)
- 화면 해상도: 1280×720 이상 권장

---

## 문서 안내

| 문서 | 대상 | 위치 |
|------|------|------|
| 사용자 운영 매뉴얼 | 일반 사용자 (디스패처, 영업 등) | `docs/USER_MANUAL.md` |
| 관리자 운영 매뉴얼 | 시스템 관리자 (Admin) | `docs/ADMIN_MANUAL.md` |
| 설치 & 배포 가이드 | IT 담당자 | `docs/INSTALL.md` |
| 테스트 매뉴얼 | QA / 도입 담당자 | `docs/TEST_MANUAL.md` |

---

## 기본 접속 정보

| 항목 | 값 |
|------|-----|
| 기본 관리자 계정 | `admin@local` |
| 기본 비밀번호 | `admin123` |
| API 문서 (Swagger) | `http://서버주소:8000/docs` |

> **주의:** 도입 후 반드시 기본 비밀번호를 변경하십시오.

---

*FreightBroker Pro — Dispatch Smarter. Settle Faster.*

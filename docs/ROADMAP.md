# FreightBroker Pro — 기능 로드맵

> **최종 업데이트**: 2026년 2월  
> **기준**: 현재 코드베이스 + ARK TMS / Rose Rocket / BrokerPro / Ascend TMS 시장조사 + Codex 코드 분석

---

## 현재 구현 완료 상태 (v1.0 기준)

> ✅ = 완전 구현 | 🔶 = 부분 구현 | ❌ = 미구현

| 기능 | 상태 | 비고 |
|------|:----:|------|
| 로드 CRUD + 상태 관리 (8단계) | ✅ | Bulk status change 포함 |
| Shipper / Consignee Stop 다중 등록 | ✅ | |
| Carrier Segment + 재무 자동 계산 | ✅ | Revenue/Cost/Profit/GST |
| Rate Confirmation / BOL / LC / Pallet Tag (HTML+PDF) | ✅ | 회사 브랜딩 포함 |
| 문서 이메일 발송 (SMTP) | ✅ | |
| 첨부 파일 업로드 (POD/BOL/RC/Other) | ✅ | 20MB, 화이트리스트 검증 |
| 파트너(고객/캐리어) 관리 | ✅ | MC/DOT/보험만료일 포함 |
| AR 인보이스 (Draft→Sent→Paid) | ✅ | PDF, 연체 필터 |
| AP Payable (Draft→Paid) | ✅ | PDF |
| 대시보드 KPI (AR Outstanding, Overdue, 보험만료) | ✅ | |
| Revenue / Carrier Performance / By Lane 리포트 | ✅ | |
| CSV 내보내기 (Loads, AR, AP) | ✅ | |
| 포털 사용자 (고객/캐리어 데이터 격리) | ✅ | 메뉴 제한 + 데이터 필터 |
| 사용자 계정 관리 + 역할(RBAC) | ✅ | admin/dispatcher/sales/billing |
| 시스템 설정 (브랜딩, SMTP, 기본값) | ✅ | |
| 재고 관리 (창고 + SKU) | ✅ | |
| 로드 노트 | ✅ | |

**종합 성숙도**: 실무 핵심 플로우 커버 완료. 안정화 및 고도화 단계 진입.

---

## Phase 1 — 안정화 스프린트 (즉시 / 1~2주)

> Codex P0/P1 항목. 배포 전 필수.

### ✅ 완료된 P0 항목 (이번 세션)
- [x] 프론트엔드 빌드 오류 수정 (`Dashboard.tsx` optional 필드, `Reports.tsx` unused import)
- [x] `SECRET_KEY` 취약값 경고 로그 추가 (운영 배포 시 강제 인지)
- [x] CORS 하드코딩 IP 제거 → `.env`의 `CORS_ORIGINS`만 사용
- [x] 토큰 만료 7일 → **8시간**으로 단축 (보안 강화)
- [x] `componentDidCatch` 무의미한 `setState` 제거
- [x] `load_notes.py` user None 접근 버그 수정
- [x] `datetime.utcnow()` deprecated → `datetime.now(timezone.utc)` 교체
- [x] `update_load` PATCH에서 commit 전 `db.refresh()` 버그 수정

### 남은 P1 항목 (권장 1주 내)

| # | 항목 | 영향 | 난이도 |
|---|------|------|:------:|
| 1 | **기본 admin 비밀번호 첫 로그인 시 강제 변경 유도** | 보안 | 하 |
| 2 | **loads.py 서비스 레이어 분리** (계산/CRUD/CSV 책임 분리) | 유지보수 | 중 |
| 3 | **백엔드 `except Exception: pass` → 로깅으로 교체** | 장애 감지 | 하 |
| 4 | **INSTALL.md DB 포트 정합성** (5432/5433 불일치 수정) | 문서 | 하 |

---

## Phase 2 — 고부가가치 기능 (1~2개월)

> 타사 대비 체감 차이 크고 ROI 빠른 기능

### 2-1. AR 인보이스 리마인더 자동화 ⭐⭐⭐

**시장 배경**: 업계 인보이스 수동 처리 비용 $12~15/건. 자동화 시 30~60% 절감 (Ventus AI, 2025).

**현재**: overdue 카운트가 대시보드에 있으나 알림/리마인더 발송 기능 없음.

**구현 내용**:
- `Settings`에 리마인더 규칙 추가: "N일 경과 시 자동 이메일"
- 백그라운드 스케줄러 (APScheduler 또는 Celery) — 매일 1회 실행
- 이메일 템플릿: 미결제 인보이스 목록 + 결제 요청
- `customer_invoices` 테이블에 `last_reminder_sent_at` 컬럼 추가
- Invoicing 화면에 "마지막 리마인더 발송일" 컬럼 표시

```
Settings → AR Reminder: "30일 경과 시, 이후 매 7일 반복"
              ↓ 자동
         이메일 → 고객 담당자 이메일
```

---

### 2-2. Carrier 매칭/추천 (규칙 기반) ⭐⭐⭐

**시장 배경**: Rose Rocket, ARK TMS 모두 캐리어 검색/필터 기능 제공. 디스패처 생산성 핵심.

**현재**: carrier_segment에 rating/on_time 필드 있으나, 로드 배정 시 추천 기능 없음.

**구현 내용**:
- 로드 상세 → Carrier 배정 시 "추천 캐리어 Top 5" 패널
- 점수화 기준:
  - 동일 레인(Origin → Destination) 운행 이력 +3점
  - 평균 평점 4.0+ 이상 +2점
  - 정시율 80%+ 이상 +2점
  - 보험 만료 30일 이내 -5점 (경고)
- Partner 목록에 "레인별 캐리어 검색" 필터 추가

---

### 2-3. 고객/캐리어 포털 고도화 ⭐⭐⭐

**시장 배경**: 2025 Buyer's Guide — 포털이 고객 유지율과 직결. Shipper/Carrier self-service가 표준.

**현재**: 포털 계정 존재 + 데이터 격리 OK. 하지만 전용 UI가 없어 일반 내부 UI와 동일.

**구현 내용**:

*고객 포털 (Shipper Portal):*
- 전용 레이아웃 (내부 메뉴 완전 숨김)
- 내 화물 추적 화면 (상태 타임라인)
- 인보이스 조회 + PDF 다운로드
- POD/BOL 문서 다운로드

*캐리어 포털 (Carrier Portal):*
- 배정된 화물 목록
- Payable 상태 및 지급 예정일 조회
- 문서 업로드 (POD, 인보이스 제출)

---

### 2-4. Tender 워크플로우 ⭐⭐

**시장 배경**: 캐리어와의 커뮤니케이션 자동화의 기본. ARK TMS, Rose Rocket 모두 제공.

**구현 내용**:
- 로드 상세에서 **"Send Tender"** 버튼
- 캐리어 이메일로 화물 정보 발송 (HTML 이메일 템플릿)
- 수락/거절 링크 포함 (토큰 기반 원클릭)
- 수락 시 → 해당 Carrier Segment 자동 생성 + 로드 상태 → `Assigned`
- 거절 시 → 거절 사유 코드 기록 (운임/가용차량/레인 불일치 등)
- `tenders` 테이블 추가 (load_id, carrier_id, status, sent_at, responded_at)

---

### 2-5. 문서 워크플로우 자동화 ⭐⭐

**시장 배경**: 문서 누락으로 인한 지연이 업계 주요 비용 발생 요인.

**구현 내용**:
- **Delivered 상태 전환 시 POD 요청 이메일 자동 발송** (캐리어에게)
- POD 업로드 완료 시 → AR 인보이스 생성 큐에 추가 (알림)
- 로드 상세에 "POD 미업로드" 경고 표시 (delivered 이후 48시간 경과 시)
- 대시보드에 "POD 미제출 건수" KPI 추가

---

## Phase 3 — 운영 성숙도 향상 (2~4개월)

### 3-1. QuickBooks / Xero 연동 ⭐⭐

**시장 배경**: ARK TMS의 핵심 차별화. 회계 이중입력 제거.

**구현 옵션 A (빠름)**: CSV 형식 QuickBooks Import 파일 생성
- AR 인보이스 → QuickBooks IIF/CSV 내보내기
- AP Payable → QuickBooks Bill CSV 내보내기

**구현 옵션 B (완전 자동화)**: QuickBooks Online API 연동
- OAuth2 인증
- 인보이스 생성/수정 시 자동 QBO 동기화
- 지급 완료 시 QBO Bill Payment 자동 생성

---

### 3-2. 실시간 알림 시스템 ⭐⭐

**구현 내용**:
- WebSocket 또는 SSE(Server-Sent Events) 기반 실시간 알림
- 알림 유형:
  - 새 화물 배정
  - 인보이스 연체 (due_date 당일/+7일)
  - 캐리어 보험 만료 (30일/7일/당일)
  - POD 미제출 (delivered +48시간)
  - Tender 수락/거절
- 대시보드 상단 알림 벨 아이콘
- 이메일 + 인앱 알림 이중 발송 옵션

---

### 3-3. 고급 보고서 & 대시보드 ⭐⭐

**구현 내용**:
- **레인 트렌드 분석**: 월별 구간별 수익/건수 추이 차트
- **고객 수익성 순위**: 마진 기준 Top/Bottom 고객
- **캐리어 성과 트렌드**: 월별 정시율 변화
- **AR 에이징 리포트**: 0~30일 / 31~60일 / 60일+ 구간별 미수금
- **로드 건수 트렌드**: 월별/주별 화물 접수 추이
- 차트 라이브러리: Recharts (이미 React 환경)

---

### 3-4. 전자 서명 (E-Signature) ⭐

**시장 배경**: Rose Rocket 등 현대 TMS의 표준 기능. 종이 없는 워크플로우 완성.

**구현 내용**:
- Rate Confirmation에 드라이버/캐리어 전자 서명 요청
- 서명 링크 이메일 발송 → 브라우저에서 서명
- 서명된 PDF 자동 저장 및 로드에 첨부

---

## Phase 4 — 외부 연동 (장기 / 4개월+)

### 4-1. 로드보드 연동 (DAT / Truckstop) ⭐

**시장 배경**: ARK TMS의 핵심 기능. 물량/캐리어 커버리지 직결.

**구현 내용**:
- DAT API 연동 (별도 API 키 + 월 구독 필요)
- 로드 상세에서 **"Post to DAT"** 버튼
- 로드보드 게시 상태 추적
- 게시된 로드에 관심 캐리어 응답 수신

---

### 4-2. 실시간 위치 추적 ⭐

**시장 배경**: Macropoint, TruckerTools 연동이 업계 표준.

**구현 내용**:
- 캐리어에게 추적 동의 링크 발송
- 실시간 위치 → 지도 표시 (Google Maps API)
- 고객 포털에서 화물 추적 지도 제공
- ETA 자동 계산 및 고객 알림

---

### 4-3. EDI / B2B API 연동 ⭐

**대상**: 대형 고객사 (대형 유통/제조업체)

**구현 내용**:
- EDI 204 (Load Tender), 214 (Status), 210 (Invoice) 지원
- REST API Webhook: 로드 상태 변경 시 고객 시스템에 자동 전송

---

## 경쟁사 기능 비교 (현재 기준)

| 기능 | 우리 | ARK TMS | Rose Rocket | Ascend TMS |
|------|:----:|:-------:|:-----------:|:----------:|
| 로드 관리 | ✅ | ✅ | ✅ | ✅ |
| 문서 생성 (RC/BOL/PDF) | ✅ | ✅ | ✅ | ✅ |
| AR/AP 인보이싱 | ✅ | ✅ | ✅ | ✅ |
| 포털 (고객/캐리어) | 🔶 | ✅ | ✅ | ✅ |
| AR 리마인더 자동화 | ❌ | ✅ | ✅ | ✅ |
| 캐리어 매칭/추천 | ❌ | ✅ | ✅ | 🔶 |
| Tender 워크플로우 | ❌ | ✅ | ✅ | ✅ |
| QuickBooks 연동 | ❌ | ✅ | ✅ | 🔶 |
| 실시간 알림 | ❌ | ✅ | ✅ | 🔶 |
| 로드보드 연동 (DAT) | ❌ | ✅ | 🔶 | ❌ |
| 실시간 트래킹 | ❌ | ✅ | ✅ | 🔶 |
| 전자 서명 | ❌ | 🔶 | ✅ | ❌ |
| EDI 연동 | ❌ | 🔶 | ✅ | ❌ |
| AI 문서 자동화 | ❌ | ❌ | ✅ | ❌ |

---

## 성숙도 점수 (Codex 분석 기준)

| 항목 | 현재 | Phase 2 완료 후 | Phase 3 완료 후 |
|------|:----:|:---------------:|:---------------:|
| 도메인 기능 커버리지 | 8.5/10 | 9.2/10 | 9.7/10 |
| 코드 안정성 | 6.5/10 | 8.0/10 | 8.5/10 |
| 운영/문서 준비도 | 8.0/10 | 8.5/10 | 9.0/10 |
| 보안 기본값 | 6.0/10 | 8.0/10 | 9.0/10 |
| **종합** | **7.0/10** | **8.4/10** | **9.1/10** |

---

## 개발 우선순위 요약

```
즉시 (완료)   ──▶  빌드 안정화 + 보안 기본값 강화
1~2주        ──▶  P1 코드 품질 (서비스 레이어, 예외 처리)
1개월        ──▶  AR 리마인더 자동화 + 캐리어 매칭
2개월        ──▶  포털 UI 고도화 + Tender 워크플로우
3개월        ──▶  QuickBooks CSV/API + 실시간 알림
4개월+       ──▶  로드보드/트래킹/EDI 외부 연동
```

---

*이 문서는 제품 개발 방향 수립 및 고객사 도입 제안 시 참고 자료로 활용하십시오.*

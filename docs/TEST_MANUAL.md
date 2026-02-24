# FreightBroker Pro — 테스트 매뉴얼

> 대상: QA 담당자, 도입 검토 담당자, 시스템 관리자

---

## 목차

1. [테스트 환경 준비](#1-테스트-환경-준비)
2. [자동 테스트 데이터 생성](#2-자동-테스트-데이터-생성)
3. [기능 테스트 체크리스트](#3-기능-테스트-체크리스트)
4. [시나리오 테스트](#4-시나리오-테스트)
5. [API 테스트](#5-api-테스트)
6. [성능 테스트 기준](#6-성능-테스트-기준)
7. [테스트 결과 기록 양식](#7-테스트-결과-기록-양식)

---

## 1. 테스트 환경 준비

### 접속 정보

| 항목 | 값 |
|------|-----|
| 프론트엔드 URL | `http://192.168.111.137:5173` |
| 백엔드 API 문서 | `http://192.168.111.137:8000/docs` |
| 관리자 계정 | `admin@local` / `admin123` |

### 테스트 전 초기화 (선택)

기존 데이터를 초기화하고 싶은 경우 서버에서 실행합니다:

```bash
# DB 초기화 (주의: 모든 데이터 삭제)
docker compose exec db psql -U postgres -d freight_broker -c "
TRUNCATE loads, partners, customer_invoices, carrier_payables,
         users, warehouses, inventory_items, settings
RESTART IDENTITY CASCADE;
"

# 이후 서버 재시작 (admin 계정 재생성)
./restart_services.sh
```

---

## 2. 자동 테스트 데이터 생성

프로젝트 루트의 `create_test_data.py` 스크립트를 실행하면 아래 데이터가 자동 생성됩니다.

### 생성 데이터 목록

| 데이터 | 수량 |
|--------|------|
| 고객 파트너 | 10개 |
| 캐리어 파트너 (일부 보험 만료 임박) | 8개 |
| 화물 (다양한 상태, 구간, 재무 데이터) | 40개 |
| 고객 인보이스 (AR) | 13개 |
| 창고 | 3개 |
| 재고 항목 | 9개 |
| 화물 노트 | 랜덤 |

### 실행 방법

```bash
# 로컬 PC (PowerShell)
cd C:\Users\jonghun.lee\freight-broker
python create_test_data.py
```

또는 서버에서:

```bash
cd /home/john/freight-broker
source .venv/bin/activate
python create_test_data.py
```

---

## 3. 기능 테스트 체크리스트

각 항목을 테스트 후 결과를 `PASS` / `FAIL` / `N/A`로 기록합니다.

---

### 3.1 인증 (Authentication)

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 1.1 | 정상 계정으로 로그인 | 대시보드로 이동 | |
| 1.2 | 잘못된 비밀번호로 로그인 시도 | 오류 메시지 표시 | |
| 1.3 | 로그아웃 후 보호 페이지 직접 접근 | 로그인 페이지로 리다이렉트 | |
| 1.4 | 비밀번호 없이 로그인 시도 | 오류 메시지 표시 | |

---

### 3.2 대시보드 (Dashboard)

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 2.1 | 대시보드 로딩 | 통계 카드 정상 표시 | |
| 2.2 | Total Revenue / Cost / Profit 표시 | 숫자 정상 표시, CAD 단위 | |
| 2.3 | AR Outstanding 표시 | 미결 인보이스 합계 | |
| 2.4 | Insurance Expiring Soon 표시 | 30일 이내 만료 캐리어 수 | |
| 2.5 | 최근 화물 목록 표시 | 최대 10건 표시 | |
| 2.6 | 화물 번호 클릭 | 상세 페이지 이동 | |

---

### 3.3 화물 관리 (Order / Load)

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 3.1 | 화물 목록 조회 | 화물 목록 정상 표시 | |
| 3.2 | 상태별 필터 적용 | 해당 상태 화물만 표시 | |
| 3.3 | 로드 번호 검색 | 검색어 포함 화물 표시 | |
| 3.4 | 날짜 범위 필터 | 해당 기간 화물만 표시 | |
| 3.5 | 새 화물 생성 | 화물 생성 후 상세 이동 | |
| 3.6 | 화물 상태 변경 (PATCH) | 상태 즉시 반영 | |
| 3.7 | 일괄 상태 변경 | 선택된 화물 모두 변경 | |
| 3.8 | Rate 입력 시 Revenue 자동 계산 | Revenue = Rate × (1+FSC%) | |
| 3.9 | FSC % 변경 시 Revenue 재계산 | 변경 즉시 반영 | |
| 3.10 | GST 선택 시 Total 자동 계산 | Total = Revenue × 1.05 | |

---

### 3.4 Shipper / Consignee

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 4.1 | Shipper Stop 추가 | 목록에 정상 추가 | |
| 4.2 | Consignee Stop 추가 | 목록에 정상 추가 | |
| 4.3 | 여러 Shipper/Consignee 추가 | 순서(Sequence) 자동 부여 | |
| 4.4 | Stop 정보 수정 | 변경사항 저장 | |
| 4.5 | Stop 삭제 | 목록에서 제거 | |

---

### 3.5 Carrier 구간

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 5.1 | Carrier Segment 추가 | 목록에 정상 추가 | |
| 5.2 | Carrier Rate 입력 시 Total 자동 계산 | Total = Rate × (1+FSC%) | |
| 5.3 | 여러 Carrier Segment 추가 | Cost = 모든 Segment 합계 | |
| 5.4 | 평점(Rating) 1~5 입력 | 정상 저장 | |
| 5.5 | On Time 체크/해제 | 정상 저장 | |
| 5.6 | Carrier Segment에서 Payable 생성 | AP 목록에 생성 확인 | |

---

### 3.6 문서 생성

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 6.1 | Load Confirmation HTML 생성 | 새 탭에서 문서 표시 | |
| 6.2 | Rate Confirmation HTML 생성 | 새 탭에서 문서 표시 | |
| 6.3 | Bill of Lading HTML 생성 | 새 탭에서 문서 표시 | |
| 6.4 | Pallet Tag HTML 생성 | 새 탭에서 문서 표시 | |
| 6.5 | LC PDF 다운로드 | PDF 파일 다운로드 | |
| 6.6 | 문서 이메일 발송 | 성공 메시지 표시 | |
| 6.7 | 회사 로고가 문서에 표시 | 로고 이미지 표시 | |

---

### 3.7 첨부 파일

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 7.1 | PDF 파일 업로드 | 파일 목록에 추가 | |
| 7.2 | 이미지 파일 업로드 | 파일 목록에 추가 | |
| 7.3 | 20MB 초과 파일 업로드 | 413 오류 메시지 표시 | |
| 7.4 | 허용되지 않은 확장자 업로드 (.exe 등) | 415 오류 메시지 표시 | |
| 7.5 | 파일 다운로드 | 원본 파일 다운로드 | |
| 7.6 | 문서 유형 변경 (POD/BOL 등) | 변경사항 저장 | |
| 7.7 | 첨부 파일 삭제 | 목록에서 제거 | |

---

### 3.8 파트너 관리

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 8.1 | 파트너 목록 조회 | 목록 정상 표시 | |
| 8.2 | 고객/캐리어 필터 | 해당 유형만 표시 | |
| 8.3 | 새 고객 파트너 생성 | 생성 후 목록 갱신 | |
| 8.4 | 새 캐리어 파트너 생성 | MC, DOT, 보험만료일 저장 | |
| 8.5 | 파트너 정보 수정 | 변경사항 저장 | |
| 8.6 | 보험 만료 임박 캐리어 | 대시보드에 카운트 표시 | |

---

### 3.9 인보이싱

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 9.1 | AR 인보이스 목록 조회 | 목록 정상 표시 | |
| 9.2 | 새 AR 인보이스 생성 | 화물 Revenue가 금액으로 자동 입력 | |
| 9.3 | 인보이스 번호 자동 생성 | INV-{로드번호} 형식 | |
| 9.4 | AR Draft → Sent 상태 변경 | 상태 변경 확인 | |
| 9.5 | AR Sent → Paid 상태 변경 | 상태 변경 확인 | |
| 9.6 | Overdue 필터 | 만기 초과 미결만 표시 | |
| 9.7 | 인보이스 HTML 조회 | 새 탭에서 표시 | |
| 9.8 | 인보이스 PDF 다운로드 | PDF 파일 다운로드 | |
| 9.9 | AP Payable 목록 조회 | 목록 정상 표시 | |
| 9.10 | AP Draft → Paid 변경 | 상태 변경 확인 | |

---

### 3.10 보고서

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 10.1 | Customer별 Revenue 리포트 | 고객별 수익 표시 | |
| 10.2 | Carrier별 Revenue 리포트 | 캐리어별 비용 표시 | |
| 10.3 | 날짜 범위 필터 | 해당 기간 데이터만 표시 | |
| 10.4 | Carrier Performance 리포트 | 평점·정시율 표시 | |
| 10.5 | By Lane 리포트 | 레인별 수익 분석 | |
| 10.6 | Loads CSV 내보내기 | CSV 파일 다운로드 | |
| 10.7 | AR CSV 내보내기 | CSV 파일 다운로드 | |
| 10.8 | AP CSV 내보내기 | CSV 파일 다운로드 | |

---

### 3.11 재고 관리

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 11.1 | 창고 생성 | 창고 목록에 추가 | |
| 11.2 | 창고 삭제 | 목록에서 제거 | |
| 11.3 | 재고 항목 추가 | 항목 목록에 추가 | |
| 11.4 | 재고 항목 수정 (수량 변경) | 변경사항 저장 | |
| 11.5 | 재고 항목 삭제 | 목록에서 제거 | |

---

### 3.12 시스템 설정

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 12.1 | 회사명 설정 저장 | 문서에 회사명 표시 | |
| 12.2 | 로고 URL 설정 저장 | 문서에 로고 표시 | |
| 12.3 | Default FSC % 설정 | 새 화물 생성 시 적용 | |
| 12.4 | Default Tax Code 설정 | 새 화물 생성 시 적용 | |
| 12.5 | SMTP 테스트 이메일 | 수신 이메일 확인 | |

---

### 3.13 계정 관리 (Admin 전용)

| # | 테스트 항목 | 기대 결과 | 결과 |
|---|-------------|-----------|------|
| 13.1 | 사용자 목록 조회 | 목록 정상 표시 | |
| 13.2 | 새 사용자 생성 | 생성 후 목록 갱신 | |
| 13.3 | 사용자 비밀번호 변경 | 변경 후 새 비밀번호로 로그인 | |
| 13.4 | 포털 사용자 생성 | Partner 연결 후 생성 | |
| 13.5 | 포털 로그인 | 제한된 메뉴만 표시 | |
| 13.6 | 포털 사용자 데이터 격리 | 자신의 데이터만 조회 | |

---

## 4. 시나리오 테스트

실제 업무 흐름을 시뮬레이션하는 통합 테스트입니다.

---

### 시나리오 1: 신규 화물 처리 전체 흐름

**목적**: 화물 접수부터 인보이스 정산까지 전체 흐름 검증

**단계:**

1. **파트너 등록**
   - Partner → New Partner → 고객사 `ABC Logistics` 생성 (Type: Customer)
   - Partner → New Partner → 캐리어 `Fast Carrier Inc` 생성 (Type: Carrier, MC: 12345)

2. **화물 생성**
   - Order → New Load
   - Load #: `LD-202402-TEST1`
   - Customer: `ABC Logistics`
   - Rate: `2500`, FSC: `15`, Tax Code: `GST`
   - 저장

3. **Shipper 추가**
   - Shipper Name: `Toronto Warehouse`, City: `Toronto`, Province: `ON`
   - Pickup Date: 오늘 날짜, Type: `Live Load`

4. **Consignee 추가**
   - Consignee Name: `Calgary DC`, City: `Calgary`, Province: `AB`
   - Due Date: 3일 후

5. **Carrier 배정**
   - Carrier: `Fast Carrier Inc`, Rate: `1800`, FSC: `10`
   - Rating: `5`, On Time: 체크
   - 저장 후 **Create Payable** 클릭

6. **상태 변경**
   - Status: `Assigned` → `In Transit` → `Delivered`

7. **문서 생성**
   - LC (Load Confirmation) HTML 열기 → 내용 확인
   - BOL PDF 다운로드 확인

8. **AR 인보이스 발행**
   - Invoicing → New Invoice → 생성된 화물 선택
   - 금액 자동 입력 확인 (Revenue = 2875 CAD = 2500 × 1.15)
   - Create → Mark Sent → Mark Paid

9. **AP 정산**
   - Invoicing → AP 탭 → Fast Carrier Inc Payable 확인
   - Mark Paid

10. **보고서 확인**
    - Reports → Customer Revenue → ABC Logistics 확인
    - Reports → Carrier Performance → Fast Carrier Inc 평점 확인

**합격 기준**: 모든 단계 오류 없이 완료, 최종 AR/AP 상태 모두 `Paid`

---

### 시나리오 2: 포털 사용자 접근 제어

**목적**: 포털 사용자가 자신의 데이터만 접근하는지 검증

1. 고객 파트너 2개 생성: `Customer A`, `Customer B`
2. 각각에 대한 화물 2건씩 생성
3. `Customer A` 연결 포털 계정 생성: `portal.a@test.com`
4. 포털 계정으로 로그인
5. 화물 목록에서 `Customer A`의 화물만 표시되는지 확인
6. `Customer B`의 화물 ID를 직접 URL에 입력했을 때 접근 차단 확인

**합격 기준**: Customer A 화물만 표시, Customer B 화물 접근 시 Not Found

---

### 시나리오 3: 재무 계산 정확성 검증

**목적**: Rate / FSC / GST / Revenue / Cost / Profit 계산 정확도 검증

| 입력값 | Rate | FSC% | Other | Tax Code | 캐리어 Rate | 캐리어 FSC% |
|--------|------|------|-------|----------|------------|------------|
| 테스트 1 | 3000 | 10 | 0 | Exempted | 2000 | 5 |
| 테스트 2 | 5000 | 15 | 200 | GST | 3500 | 10 |

**테스트 1 기대 결과:**
- Revenue = 3000 × 1.10 = `3,300.00`
- Cost = 2000 × 1.05 = `2,100.00`
- Profit % = (3300 - 2100) / 3300 × 100 = `36.36%`
- GST = 0 (Exempted)
- Total with GST = `3,300.00`

**테스트 2 기대 결과:**
- Revenue = 5000 × 1.15 + 200 = `5,950.00`
- Cost = 3500 × 1.10 = `3,850.00`
- Profit % = (5950 - 3850) / 5950 × 100 = `35.29%`
- GST = 5950 × 0.05 = `297.50`
- Total with GST = 5950 + 297.50 = `6,247.50`

---

### 시나리오 4: 연체 인보이스 감지

1. 인보이스 생성 시 Due Date를 **어제 날짜**로 설정
2. 상태를 `Sent`로 변경
3. 대시보드의 **Overdue Invoices** 카운트 증가 확인
4. Invoicing → **Show Overdue** 토글 ON → 해당 인보이스 표시 확인

---

### 시나리오 5: 캐리어 보험 만료 알림

1. 새 캐리어 생성
2. Insurance Expiry를 **오늘로부터 20일 후**로 설정
3. 대시보드의 **Insurance Expiring Soon** 카운트 확인 (1 이상)
4. 만료일을 **35일 후**로 변경
5. 대시보드에서 해당 캐리어가 카운트에서 제외되는지 확인

---

## 5. API 테스트

백엔드 API를 직접 테스트합니다. `http://192.168.111.137:8000/docs`의 Swagger UI를 사용하거나 아래 curl 명령을 사용합니다.

### 토큰 발급

```bash
TOKEN=$(curl -s -X POST "http://192.168.111.137:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@local","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo $TOKEN
```

### 주요 API 테스트

```bash
# 대시보드 통계 조회
curl -H "Authorization: Bearer $TOKEN" \
  "http://192.168.111.137:8000/api/v1/stats/dashboard"

# 화물 목록 조회
curl -H "Authorization: Bearer $TOKEN" \
  "http://192.168.111.137:8000/api/v1/loads?limit=10"

# 파트너 목록 조회
curl -H "Authorization: Bearer $TOKEN" \
  "http://192.168.111.137:8000/api/v1/partners"

# 새 파트너 생성
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Co","type":"customer"}' \
  "http://192.168.111.137:8000/api/v1/partners"

# 설정 조회
curl -H "Authorization: Bearer $TOKEN" \
  "http://192.168.111.137:8000/api/v1/settings"
```

### 보안 테스트

```bash
# 인증 없이 API 접근 시도 → 401 응답 확인
curl -v "http://192.168.111.137:8000/api/v1/loads"
# 기대: HTTP 401 Unauthorized

# 잘못된 토큰으로 접근 → 401 응답 확인
curl -H "Authorization: Bearer invalid_token_here" \
  "http://192.168.111.137:8000/api/v1/loads"
# 기대: HTTP 401 Unauthorized
```

---

## 6. 성능 테스트 기준

### 응답 시간 기준 (단일 사용자)

| 기능 | 허용 응답 시간 |
|------|--------------|
| 로그인 | < 1초 |
| 대시보드 로딩 | < 2초 |
| 화물 목록 (100건) | < 2초 |
| 화물 상세 조회 | < 1초 |
| 화물 저장 | < 1초 |
| PDF 생성 | < 5초 |
| CSV 내보내기 (500건) | < 5초 |

### 동시 접속 테스트 (권장)

- 5명 동시 접속 시 응답 시간이 단일 사용자 기준의 2배 이하
- 10명 동시 접속 시 오류율 0%

---

## 7. 테스트 결과 기록 양식

```
=== FreightBroker Pro 테스트 결과 ===

테스트 일시: ____년 __월 __일
테스트 담당자: _______________
테스트 환경: http://_______________:5173
테스트 버전/빌드: _______________

--- 기능 테스트 요약 ---

섹션                  | 총 항목 | PASS | FAIL | N/A
----------------------|---------|------|------|-----
인증                  |    4    |      |      |
대시보드              |    6    |      |      |
화물 관리             |   10    |      |      |
Shipper/Consignee     |    5    |      |      |
Carrier 구간          |    6    |      |      |
문서 생성             |    7    |      |      |
첨부 파일             |    7    |      |      |
파트너 관리           |    6    |      |      |
인보이싱              |   10    |      |      |
보고서                |    8    |      |      |
재고 관리             |    5    |      |      |
시스템 설정           |    5    |      |      |
계정 관리             |    6    |      |      |

합계                  |   85    |      |      |

--- 시나리오 테스트 요약 ---

시나리오 1 (전체 흐름):     PASS / FAIL
시나리오 2 (포털 제어):     PASS / FAIL
시나리오 3 (재무 계산):     PASS / FAIL
시나리오 4 (연체 감지):     PASS / FAIL
시나리오 5 (보험 만료):     PASS / FAIL

--- FAIL 항목 목록 ---

번호 | 항목 | 재현 방법 | 기대 결과 | 실제 결과 | 비고
-----|------|----------|-----------|-----------|-----
1.   |      |          |           |           |
2.   |      |          |           |           |

--- 최종 의견 ---

[ ] 합격 — 프로덕션 사용 가능
[ ] 조건부 합격 — FAIL 항목 수정 후 재테스트 필요
[ ] 불합격 — 주요 기능 오류로 추가 개발 필요

서명: _______________ 날짜: _______________
```

---

*테스트 중 발견된 버그는 시스템 공급사에 즉시 보고하십시오.*

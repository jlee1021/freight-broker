# FreightBroker Pro — 사용자 운영 매뉴얼

> 대상: 디스패처, 영업 담당자, 청구 담당자, 포털 사용자

---

## 목차

1. [로그인](#1-로그인)
2. [대시보드](#2-대시보드)
3. [화물 관리 (Order)](#3-화물-관리-order)
4. [화물 상세 — 기본 정보](#4-화물-상세--기본-정보)
5. [화물 상세 — Shipper / Consignee](#5-화물-상세--shipper--consignee)
6. [화물 상세 — Carrier 구간](#6-화물-상세--carrier-구간)
7. [화물 상세 — 문서 및 첨부 파일](#7-화물-상세--문서-및-첨부-파일)
8. [화물 상세 — 노트](#8-화물-상세--노트)
9. [파트너 관리 (Partner)](#9-파트너-관리-partner)
10. [인보이싱 (Invoicing)](#10-인보이싱-invoicing)
11. [이익 분석 (Profit)](#11-이익-분석-profit)
12. [보고서 (Reports)](#12-보고서-reports)
13. [재고 관리 (Inventory)](#13-재고-관리-inventory)
14. [포털 사용자 안내](#14-포털-사용자-안내)

---

## 1. 로그인

1. 브라우저에서 시스템 주소 접속 (예: `http://192.168.1.100:5173`)
2. **이메일**과 **비밀번호**를 입력하고 **Sign In** 클릭
3. 로그인 성공 시 대시보드로 이동

> **기본 계정:** `admin@local` / `admin123`  
> 도입 후 관리자에게 개인 계정을 발급받아 사용하십시오.

---

## 2. 대시보드

로그인 직후 표시되는 메인 화면으로, 현재 운영 상태를 한눈에 확인할 수 있습니다.

### 표시 항목

| 항목 | 설명 |
|------|------|
| Total Loads | 전체 화물 건수 |
| Total Revenue | 총 수익 (CAD) |
| Total Cost | 총 비용 (CAD) |
| Total Profit | 총 이익 (CAD) |
| AR Outstanding | 미수금 합계 (CAD) |
| Overdue Invoices | 연체 인보이스 건수 |
| Insurance Expiring Soon | 보험 만료 임박 캐리어 수 (30일 이내) |

### 상태별 화물 현황

대시보드 하단에 상태별 화물 수가 표시됩니다.

| 상태 | 의미 |
|------|------|
| Pending | 접수 대기 중 |
| Unassigned | 캐리어 미배정 |
| On Hold | 보류 중 |
| Need to Cover | 캐리어 추가 배정 필요 |
| Assigned | 캐리어 배정 완료 |
| In Transit | 운송 중 |
| Delivered | 배송 완료 |
| Cancel | 취소 |

### 최근 화물 목록

하단에 최근 생성된 화물 10건이 표시됩니다. 로드 번호를 클릭하면 상세 페이지로 이동합니다.

---

## 3. 화물 관리 (Order)

좌측 메뉴 **Order**를 클릭하면 화물 목록이 표시됩니다.

### 화물 목록 화면 구성

- **New Load** 버튼: 새 화물 생성
- **검색창**: 로드 번호로 검색
- **상태 필터**: All / Pending / Assigned 등 상태별 필터
- **고객 필터**: 특정 고객 화물만 표시
- **날짜 필터**: 생성일 기준 기간 조회

### 새 화물 생성

1. **New Load** 버튼 클릭
2. 기본 정보 입력 후 저장 (로드 번호, 고객, 상태 등)
3. 저장 후 상세 페이지로 이동하여 Shipper/Consignee/Carrier 정보 추가

### 일괄 상태 변경

1. 목록에서 체크박스로 여러 화물 선택
2. 상단에 나타나는 **Bulk Status Change** 드롭다운에서 변경할 상태 선택
3. **Apply** 클릭 → 선택된 모든 화물의 상태가 일괄 변경됨

---

## 4. 화물 상세 — 기본 정보

화물 목록에서 로드 번호를 클릭하거나, **New Load**를 눌러 진입합니다.

### 기본 정보 필드

| 필드 | 설명 | 필수 |
|------|------|:----:|
| Load # | 로드 번호 (자동 생성 또는 직접 입력) | ✓ |
| Status | 화물 상태 | ✓ |
| Customer | 고객사 선택 | |
| Dispatcher | 담당 디스패처 | |
| Sales Rep | 담당 영업 | |
| Billing Rep | 담당 청구 | |
| Equipment Type | 차량 유형 (Dry Van, Reefer 등) | |
| Commodity | 화물 품목명 | |
| Weight | 중량 | |
| PO Number | 고객 PO 번호 | |

### 요금 및 재무 정보

| 필드 | 설명 |
|------|------|
| Rate | 기본 운임 (CAD) — 직접 입력 |
| FSC % | 유류할증료 비율 (%) |
| Tax Code | GST 과세 여부 (GST / Exempted) |
| Other Charges | 기타 추가 요금 |
| **Revenue** | 자동 계산: Rate × (1 + FSC%) + Other Charges |
| **Cost** | 자동 계산: 모든 캐리어 구간 요금 합계 |
| **Profit %** | 자동 계산: (Revenue - Cost) / Revenue × 100 |
| **GST** | 자동 계산: Tax Code = GST일 때 Revenue × 5% |
| **Total with GST** | 자동 계산: Revenue + GST |

> 파란색 배경으로 표시된 필드는 자동 계산 값입니다. 직접 수정 불가합니다.

---

## 5. 화물 상세 — Shipper / Consignee

### Shipper Stop (발송지) 추가

1. **+ Add Shipper** 버튼 클릭
2. 아래 정보 입력:

| 필드 | 설명 |
|------|------|
| Name | 발송 업체명 |
| Address | 주소 |
| City | 도시 |
| Province | 주/도 (예: ON, AB, BC) |
| Country | 국가 (기본값: CANADA) |
| Postal Code | 우편번호 |
| Pickup Date | 픽업 날짜 |
| Time Start ~ End | 픽업 가능 시간 |
| Type | 유형 (예: Live Load, Drop) |
| Pallet Info | 팔레트 수량/정보 |
| Notes | 특이사항 |

3. **Save** 클릭

### Consignee Stop (수신지) 추가

Shipper와 동일하나, **Due Date** (납기일) 필드가 추가됩니다.

### 여러 Shipper/Consignee

동일 화물에 여러 발송지/수신지를 추가할 수 있습니다. 순서(Sequence)가 자동 지정됩니다.

---

## 6. 화물 상세 — Carrier 구간

### Carrier Segment 추가

1. **+ Add Carrier** 버튼 클릭
2. 정보 입력:

| 필드 | 설명 |
|------|------|
| Carrier | 캐리어 선택 (파트너 목록에서) |
| Rate | 캐리어에게 지급할 운임 |
| FSC % | 캐리어 유류할증료 |
| Tax Code | 세금 코드 |
| **Total** | 자동 계산: Rate × (1 + FSC%) |
| Carrier Invoice # | 캐리어 인보이스 번호 |
| Invoice Date | 캐리어 인보이스 날짜 |
| LC Number | 캐리어 LC 번호 |
| Load Status | 캐리어 구간 상태 |
| Rating | 캐리어 평점 (1~5) |
| On Time | 정시 배송 여부 (체크) |

3. **Save** 클릭 → 저장 시 전체 화물 비용(Cost)이 자동 재계산됨

### Carrier Payable 생성

캐리어 구간 저장 후 **Create Payable** 버튼이 나타납니다. 클릭하면 해당 구간에 대한 AP(매입채무)가 자동 생성됩니다.

---

## 7. 화물 상세 — 문서 및 첨부 파일

### 문서 생성

화물 상세 페이지 우측 상단 **Documents** 섹션에서 클릭 한 번으로 문서를 생성합니다.

| 버튼 | 생성 문서 |
|------|-----------|
| LC | Load Confirmation (화물 확인서) |
| Rate Confirmation | 운임 확인서 |
| BOL | Bill of Lading (화물 운송장) |
| Pallet Tag | 팔레트 태그 |

- 각 문서 옆 **PDF** 버튼: PDF 다운로드
- **Send** 버튼: 이메일로 문서 발송 (수신자 이메일 입력 필요)

### 첨부 파일 관리

1. **Upload** 버튼 클릭 → 파일 선택
   - 허용 형식: PDF, 이미지(JPG/PNG), Word, Excel, CSV, TXT
   - 최대 크기: 20MB
2. 업로드된 파일 목록에서:
   - **다운로드**: 파일명 클릭
   - **유형 변경**: 드롭다운에서 POD / BOL / Rate Confirmation / Other 선택
   - **삭제**: 휴지통 아이콘 클릭

---

## 8. 화물 상세 — 노트

화물에 내부 메모를 남길 수 있습니다.

1. 하단 **Notes** 섹션에서 텍스트 입력
2. **Add Note** 클릭
3. 작성된 노트는 작성자명 · 시간과 함께 표시됩니다
4. 자신이 작성한 노트는 삭제 가능

---

## 9. 파트너 관리 (Partner)

좌측 메뉴 **Partner**를 클릭합니다.

### 파트너 목록

- **유형 필터**: All / Customer / Carrier
- 파트너명 클릭 → 상세/수정 페이지 이동

### 새 파트너 생성

1. **New Partner** 버튼 클릭
2. 정보 입력:

**공통 필드**

| 필드 | 설명 | 필수 |
|------|------|:----:|
| Name | 업체명 | ✓ |
| Type | 고객(Customer) / 캐리어(Carrier) | ✓ |
| Contact Email | 담당자 이메일 | |
| Contact Phone | 담당자 전화 | |
| Address / City / Province | 주소 | |
| Payment Terms | 결제 조건 (예: Net 30) | |

**캐리어 전용 필드**

| 필드 | 설명 |
|------|------|
| MC Number | 모터 캐리어 번호 |
| DOT Number | 미국 교통부 번호 |
| Insurance Expiry | 보험 만료일 — 30일 이내 만료 시 대시보드에 경고 표시 |

3. **Save** 클릭

---

## 10. 인보이싱 (Invoicing)

좌측 메뉴 **Invoicing**을 클릭합니다.

### AR — 고객 인보이스

#### 인보이스 생성

1. **AR** 탭 선택
2. **New Invoice** 버튼 클릭
3. 로드 번호 또는 고객으로 화물 검색 후 선택
4. 금액은 해당 화물의 **Revenue**가 자동 입력됨
5. **Due Date** 확인 (기본값: 생성일 + 30일)
6. **Create** 클릭

#### 인보이스 상태 관리

| 버튼 | 다음 상태 | 시점 |
|------|----------|------|
| Mark Sent | Draft → Sent | 고객에게 인보이스 발송 후 |
| Mark Paid | Sent → Paid | 입금 확인 후 |

#### 인보이스 조회 및 다운로드

- **View** 버튼: 브라우저에서 인보이스 HTML 미리보기
- **PDF** 버튼: PDF 파일 다운로드
- 미리보기 화면에서 **Ctrl+P** → PDF 저장 가능

#### 연체 필터

- **Show Overdue** 토글: 만기일이 지난 미결 인보이스만 표시

### AP — 캐리어 지급 (Payable)

#### Payable 생성 방법

화물 상세 페이지의 Carrier 구간에서 **Create Payable** 버튼 클릭 시 자동 생성됩니다.

#### Payable 상태 관리

- **Mark Paid**: 캐리어 지급 완료 처리

---

## 11. 이익 분석 (Profit)

좌측 메뉴 **Profit**을 클릭합니다.

- **Total Revenue**: 전체 수익 합계
- **Total Cost**: 전체 비용 합계
- **Total Profit**: 전체 이익 합계 (Revenue - Cost)

---

## 12. 보고서 (Reports)

좌측 메뉴 **Reports**를 클릭합니다.

### Revenue Report

고객별 또는 캐리어별 수익 현황을 조회합니다.

1. **Group By** 드롭다운에서 Customer 또는 Carrier 선택
2. 날짜 범위 설정 (From / To)
3. 표 형태로 결과 표시

| 컬럼 | 설명 |
|------|------|
| Name | 고객/캐리어명 |
| Revenue | 수익 (고객별만) |
| Cost | 비용 (캐리어별만) |
| Profit | 이익 |
| Load Count | 화물 건수 |

### Carrier Performance

캐리어별 성과를 조회합니다.

| 컬럼 | 설명 |
|------|------|
| Carrier | 캐리어명 |
| Avg. Rating | 평균 평점 (1~5) |
| On Time | 정시 배송 건수 |
| Total Loads | 전체 배정 건수 |
| On Time % | 정시 배송률 |

### By Lane

출발지-목적지 구간별 수익 분석입니다.

| 컬럼 | 설명 |
|------|------|
| Origin | 출발지 (시/도) |
| Destination | 도착지 (시/도) |
| Load Count | 화물 건수 |
| Revenue | 수익 |
| Cost | 비용 |
| Profit | 이익 |

### CSV 내보내기

Reports 페이지 상단에서 다음 데이터를 CSV로 다운로드할 수 있습니다:

- **Export Loads CSV**: 화물 전체 데이터
- **Export AR CSV**: 고객 인보이스 전체
- **Export AP CSV**: 캐리어 지급 전체

---

## 13. 재고 관리 (Inventory)

좌측 메뉴 **Inventory**를 클릭합니다.

### 창고 추가

1. **창고명**과 **주소**를 상단 폼에 입력
2. **Add Warehouse** 클릭
3. 생성된 창고가 목록에 표시됨

### 재고 항목 관리

1. 창고 선택 (탭 형태)
2. **SKU**, **품목명**, **수량** 입력
3. **Add Item** 클릭

---

## 14. 포털 사용자 안내

포털 계정은 **고객사** 또는 **캐리어**가 자신의 정보를 직접 조회할 수 있는 제한된 계정입니다.

### 포털 계정 특징

- 일반 메뉴(파트너, 인보이싱, 보고서 등)는 접근 불가
- **고객 포털**: 자신의 화물 현황 및 인보이스만 조회 가능
- **캐리어 포털**: 자신이 배정된 화물 및 Payable만 조회 가능

### 포털 로그인

일반 로그인과 동일한 주소에서 접속합니다. 관리자로부터 발급받은 이메일/비밀번호를 사용합니다.

> 포털 계정 발급은 시스템 관리자에게 요청하십시오.

---

## 자주 묻는 질문 (FAQ)

**Q. 로드 번호는 어떻게 생성되나요?**  
A. 새 로드 생성 시 `LD-YYYYMM-XXXX` 형식으로 자동 생성됩니다. 직접 입력도 가능합니다.

**Q. Revenue가 0으로 표시됩니다.**  
A. Rate 필드에 운임을 입력하면 자동 계산됩니다.

**Q. PDF 다운로드가 안 됩니다.**  
A. 서버에 WeasyPrint가 설치되어 있어야 합니다. 설치가 안 된 경우 HTML 미리보기에서 Ctrl+P로 직접 PDF 저장하십시오.

**Q. 이메일 발송이 안 됩니다.**  
A. 설정(Settings) 메뉴에서 SMTP 정보가 올바르게 입력되어 있는지 확인하십시오.

**Q. 캐리어 보험 만료 경고는 어디서 확인하나요?**  
A. 대시보드 상단의 **Insurance Expiring Soon** 항목에서 확인할 수 있습니다.

---

*문의: 시스템 관리자에게 연락하십시오.*

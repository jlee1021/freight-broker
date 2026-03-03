# Dashboard UI/UX 참고 — 타사 Freight Broker·TMS 및 개선 제안

> 타사 Freight Broker·TMS 대시보드 사례를 검색해 정리하고, 우리 솔루션 Dashboard를 **시각화·효율** 관점에서 업그레이드하기 위한 참고 예시와 제안을 담은 문서입니다.

---

## 1. 타사 솔루션·참고 자료 요약

### 1.1 직접 참고할 수 있는 예시 (링크)

| 출처 | URL | 특징 |
|------|-----|------|
| **Flowbite – Logistics Dashboard** | https://flowbite.com/application-ui/demo/homepages/logistics/ | Tailwind 기반 **물류 대시보드 데모**. KPI 카드 4개(Revenue, Completed orders, Material stock, On time delivery)에 **전월 대비 %** 표시, 국가별 주문 차트, 재고 추이, “Total trucks on the road” 위젯, 기간 선택(Last 7/30/90 days, Custom), 최신 Shipments 테이블(검색·필터·CSV 내보내기). 우리와 스택이 비슷해 **레이아웃·카드 디자인** 참고하기 좋음. |
| **Retool – Logistics Dashboard** | https://retool.com/templates/logistics-dashboard | 로지스틱스 대시보드 템플릿. 메트릭·차트·테이블 구성 참고. |
| **EZ Loader TMS – Load Pipeline** | https://www.ezloadertms.com/load-pipelines | **칸반 스타일 로드 파이프라인**. 상태별 컬럼(스케줄 픽업 → 인트랜짓 → 배송 등), **Today / Tomorrow / Overdue** 토글, 컬러 카드, 클릭으로 상세 편집. 우리 “Loads by Status”를 **파이프라인 뷰**로 바꿀 때 참고. |
| **Usedatabrain – TMS Dashboard 가이드** | https://www.usedatabrain.com/blog/transport-management-dashboard | TMS 대시보드 **KPI·템플릿·사용 사례** 정리. On-Time Delivery, Cost per Mile, Carrier Performance, Fill Rate, Order Cycle Time 등 **지표 정의**와 “월별 비용 추이·화물 유형별 분포” 등 **차트/메트릭 예시** 설명. |
| **Mothership – TMS Dashboard** | https://www.mothership.com/tms-dashboard | TMS 대시보드 기능 소개. |
| **FreightPath – Analytics** | https://freightpath.io/solutions/analytics | 프레이트 브로커용 **분석·리포팅** 강조. 액션 가능한 메트릭. |
| **OpenTrack – Dashboard** | https://www.opentrack.co/solution-features/dashboard | 예외 모니터링, 알림, 자동 리포트. |

---

## 2. 타사에서 공통으로 쓰는 대시보드 요소

### 2.1 KPI 카드 (상단 메트릭)

- **표시 방식**: 숫자 + 라벨 + **전 기간 대비 변화**(예: “19% vs last month”, 상승/하락 화살표 또는 색상).
- **자주 쓰는 지표**  
  - Revenue / Cost / Profit (우리도 보유)  
  - **Completed orders** (완료된 로드 수)  
  - **On-time delivery rate (%)** — 업계 벤치마크 95%+  
  - **AR Outstanding** (미수금) — 우리도 보유  
  - Material stock / Inventory level (재고 연동 시)  
  - **Total deliveries** (배송 완료 건수)

### 2.2 기간 선택 (Time-period selector)

- **Last 7 days / Last 30 days / Last 90 days / Today / Yesterday / Custom period**.
- 대시보드 전체 또는 위젯별로 기간을 바꿔서 비교. 우리는 현재 **기간 필터 없음** → 추가 시 “이번 달 / 지난 달 수익·로드 수” 등 비교 가능.

### 2.3 시각화 위젯

- **차트**  
  - **상태별·기간별 로드 수**: 막대/도넛 차트.  
  - **수익·비용 추이**: 라인 차트(일/주/월).  
  - **국가/지역별**: 지도 또는 막대(우리는 지역 데이터가 있으면 적용 가능).
- **칸반(파이프라인)**  
  - 로드 상태를 **컬럼**으로(pending → assigned → in_transit → delivered).  
  - 카드에 Load#, 고객, 픽업 시간, 장비 등 요약.  
  - “Today / Tomorrow / Overdue” 필터.  
- **재고/배송**  
  - 재고 수준 추이(라인), “Total trucks on the road” 같은 운영 지표(우리 도메인에 맞게 변형 가능).

### 2.4 알림·액션 영역

- **연체 인보이스**, **보험 만료 임박 캐리어** — 우리는 이미 배너로 표시.  
- 타사는 “Exception monitoring”, “Proactive alerts”로 **한곳에 모아 표시**하는 경우가 많음.

### 2.5 최근/실시간 목록 + 빠른 액션

- **Latest shipments** 테이블: 검색, 필터(상태·기간), CSV 내보내기, 행 클릭으로 상세.  
- 우리 “Recent Loads”를 **테이블 + 기간 필터**로 확장하면 유사한 UX.

---

## 3. 우리 현재 Dashboard와의 갭

| 항목 | 현재 우리 | 타사 패턴 | 개선 방향 |
|------|------------|-----------|-----------|
| KPI 카드 | 숫자만 표시 | 숫자 + **전 기간 대비 %·화살표** | 카드에 “vs last month” 또는 “vs last week” 추가 (백엔드에서 비교 기간 데이터 제공 필요) |
| 기간 | 고정(전체) | 7/30/90일, Today, Custom | 기간 선택 드롭다운 추가 → API에 `date_from`/`date_to` 전달 |
| Loads by Status | 텍스트 버튼 나열 | **칸반 컬럼** 또는 **막대/도넛 차트** | 상태별 개수를 차트로 시각화하거나, 미니 칸반(클릭 시 Order 필터) 도입 |
| Recent Loads | 단순 리스트 | 테이블 + 검색·필터·기간·Export | 테이블화, “Last 7 days” 등 필터, 필요 시 CSV 내보내기 |
| 수익/비용 추이 | 없음 | **라인/막대 차트** (일/주/월) | “Revenue / Cost trend” 위젯 추가 (백엔드 시계열 API 필요) |
| 알림 | 2개 배너(연체·보험) | 알림/예외를 한 블록으로 묶음 | “Alerts” 한 섹션으로 묶고, 아이콘·우선순위 표시 |

---

## 4. 적용 우선순위 제안 (우리 Dashboard 업그레이드)

### Phase 1 — 빠르게 적용 가능 (백엔드 변경 최소)

1. **KPI 카드 디자인 개선**  
   - 카드에 작은 아이콘(로드·돈·경고 등) 추가.  
   - Revenue/Cost/Profit 카드에 **색 구분**(수익 녹색, 비용 빨강 등, 또는 중립 회색).  
   - 카드 호버 시 약간 그림자/스케일로 “클릭 가능” 느낌 부여.

2. **Loads by Status를 시각적으로**  
   - 현재 버튼 스타일 유지하되, **개수에 비례한 막대(progress bar)** 를 옆에 표시하거나, **도넛/파이 차트** 1개로 “상태별 비율” 표시.  
   - 클릭 시 `/order?status=...` 이동은 그대로.

3. **Recent Loads를 테이블로**  
   - 컬럼: Load#, Status, Customer, Rate, Created.  
   - “View orders →” 링크를 테이블 상단 또는 하단으로.

4. **알림 영역 통합**  
   - “Alerts” 또는 “Attention” 제목 아래 연체 인보이스·보험 만료를 한 블록으로, 아이콘(⚠️)과 함께 정리.

### Phase 2 — 백엔드 확장 후

5. **기간 선택**  
   - “Last 7 days / 30 days / 90 days / This month” 드롭다운.  
   - `/stats/dashboard?date_from=...&date_to=...` 등 API 확장 후, KPI·Recent Loads에 적용.

6. **전 기간 대비 변화**  
   - `/stats/dashboard`가 “이번 달 수익” vs “지난 달 수익” 같은 비교값을 주면, 카드에 “+12% vs last month” (녹색) / “-5%” (빨강) 표시.

7. **수익/비용 추이 차트**  
   - `/stats/revenue-cost-trend?period=7d` 같은 시계열 API 추가 후, 라인 차트 또는 막대 차트 위젯.

### Phase 3 — 선택

8. **미니 로드 파이프라인(칸반)**  
   - Dashboard에 “Today’s loads” 같은 제목으로, 상태별 컬럼 3~4개만 보여 주고, 각 컬럼에 카드 2~3개만 표시 + “View all” → Order 페이지로.

9. **지역/고객별 요약**  
   - 데이터가 있으면 “Revenue by customer” 또는 “Loads by region” 막대 차트.

---

## 5. 참고할 UI 라이브러리·차트 (프론트엔드)

- **Tailwind만 사용 중**이므로, **차트**는 다음 중 하나 도입 검토:  
  - **Recharts** (React 전용, 가벼움)  
  - **Chart.js** + **react-chartjs-2**  
  - **Apache ECharts** (react-echarts)
- **아이콘**: 현재 SVG 인라인 사용 중. 통일이 필요하면 **Heroicons** 또는 **Lucide React** 추가.
- **카드/그리드**: Flowbite 예시처럼 “4열 그리드 + 카드 내부에 작은 트렌드 텍스트”만 해도 시각적 개선 효과 큼.

---

## 6. 요약

- **참고할 타사 예시**: Flowbite(레이아웃·KPI 카드·기간 선택), EZ Loader(로드 파이프라인), Usedatabrain(KPI 정의·차트 종류), Retool(템플릿).
- **공통 패턴**: KPI 카드 + 전 기간 대비 변화, 기간 선택, 차트(상태별·추이), 칸반/파이프라인, 알림 통합, 최근 목록 테이블화.
- **우리 개선**: Phase 1에서 **카드 디자인·상태 시각화(차트/막대)·Recent 테이블·알림 통합** → Phase 2에서 **기간 선택·비교 지표·추이 차트** → Phase 3에서 **미니 파이프라인·고객/지역 차트** 순으로 적용하면, 타사 수준의 시각화·효율을 단계적으로 맞출 수 있습니다.

이 문서를 디자이너·관리자와 공유한 뒤, “Phase 1부터 적용” 등 범위를 정하면 개발 시 `Dashboard.tsx`와 `/stats/dashboard` API를 이 가이드에 맞춰 수정하면 됩니다.

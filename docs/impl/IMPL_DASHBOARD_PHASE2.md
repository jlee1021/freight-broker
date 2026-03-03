# Dashboard Phase 2 구현 정리

> **목적**: 기간 선택, 전 기간 대비 변화율, 수익/비용 추이 차트를 적용한다.  
> **참고**: `docs/DASHBOARD_UI_UX_REFERENCE.md` Phase 2  
> **작성일**: 2026-03-03  

---

## 1. Phase 2 목표 (요약)

| 항목 | 내용 |
|------|------|
| **기간 선택** | All time / Last 7 days / Last 30 days / Last 90 days / This month 드롭다운 |
| **전 기간 대비 변화** | KPI 카드에 "±X% vs prev" 표시 (수익·이익·로드: 상승 녹색/하락 빨강, 비용: 하락 녹색/상승 빨강) |
| **수익/비용 추이 차트** | 기간별 Revenue / Cost / Profit 막대 차트 (Recharts), 선택 기간에 따라 month/week 버킷 |

---

## 2. 백엔드 변경

### 2.1 파일

- `backend/app/api/routes/stats.py`

### 2.2 GET /stats/dashboard 확장

- **쿼리 파라미터**: `date_from`, `date_to` (optional). 있으면 Load를 해당 기간만 집계.
- **이전 기간 비교**: 같은 길이의 직전 기간을 계산해 `prev_revenue`, `prev_cost`, `prev_profit`, `prev_loads`, `pct_change_*` 응답에 추가.
- **응답**: `date_from`, `date_to` 문자열 포함.

### 2.3 GET /stats/revenue-cost-trend 신규

- **파라미터**: `date_from`, `date_to`, `group` (month | week).
- **응답**: `items`: `{ period, revenue, cost, profit }[]`. `date_trunc`로 그룹핑.

---

## 3. 프론트엔드 변경

- `frontend/src/pages/Dashboard.tsx`: 기간 선택 셀렉트, KPI 카드에 % 표시, Recharts 막대 차트.
- `frontend/package.json`: recharts 의존성 추가.

---

## 4. 테스트 체크리스트

- [ ] 기간 선택 시 KPI·Recent Loads가 해당 기간만 반영
- [ ] 이전 기간 대비 % 카드 표시 (비용은 감소=녹색)
- [ ] 기간 선택 시 "Profit (Loads) by period" 차트 표시, All time 시 차트 미표시

---

## 5. 참고

- Phase 1: `docs/impl/IMPL_DASHBOARD_PHASE1.md`
- Phase 3: `docs/impl/IMPL_DASHBOARD_PHASE3.md`

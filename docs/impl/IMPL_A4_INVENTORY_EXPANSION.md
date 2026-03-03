# A4 — Inventory 확장: Size / Cost / Total / Entry Date / Note / 날짜 필터

> **구현일**: 2026-03-03  
> **상태**: ✅ 완료

---

## 1. 변경 내용

### inventory_items 신규 컬럼
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `size` | VARCHAR(100) | 크기 (예: S/M/L, 10×20cm) |
| `cost` | NUMERIC(12,2) | 단가 |
| `total` | NUMERIC(14,2) | 합계 (Qty × Cost, 미입력 시 자동 계산) |
| `entry_date` | DATE | 입고일 |
| `note` | TEXT | 메모 |

## 2. 신규 기능

- `/inventory/items` — 전체 창고 아이템 통합 조회 (검색·날짜 필터)
- `/inventory/warehouses/{id}/items?q=&from_date=&to_date=` — 날짜 필터 지원

## 3. 프론트엔드

- **All Warehouses 선택** → 전체 아이템 보기
- **From/To Date 필터** → entry_date 기반 필터링
- **아이템 추가 모달**: Size, Cost, Total(자동계산), Entry Date, Note 필드 추가
- **테이블 하단 Total 합계** 행 표시
- **Total 자동계산**: Qty × Cost → Total 실시간 반영

## 4. 마이그레이션
```bash
alembic upgrade head  # 015_inventory_expansion 적용
```

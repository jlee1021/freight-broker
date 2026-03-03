# A6 — Consolidation (통합 로드)

> **구현일**: 2026-03-03 | **상태**: ✅ 완료

## 데이터 모델
- `consolidations`: id, consolidation_number(UNIQUE), status, description, equipment_type, total_weight, weight_unit, is_active, created_by, last_modified_by, created_at
- `consolidation_shippers`: id, consolidation_id(FK), partner_id(FK nullable), name, address, city, contact, pickup_date, pallet_count, weight, notes, sequence
- `consolidation_consignees`: id, consolidation_id(FK), partner_id(FK nullable), name, address, city, contact, delivery_date, pallet_count, weight, notes, sequence

## API (`/api/v1/consolidations`)
CRUD + `/{id}/shippers` + `/{id}/consignees` CRUD

## UI (`/consolidation`)
- 좌측: 목록 패널 (상태 필터)
- 우측: 상세 패널 — Customer/Shippers 테이블 + Carrier/Consignees 테이블
- 신규 생성 모달, Shipper/Consignee 추가 모달

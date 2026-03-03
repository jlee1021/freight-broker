# A5 — Load/Order 확장: Bill To / 감사필드 / 팔레트 / Carrier 구간

> **구현일**: 2026-03-03  
> **상태**: ✅ 완료

---

## 1. loads 신규 컬럼
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `bill_to` | VARCHAR(255) | 청구 대상 |
| `order_id` | VARCHAR(100) | Order ID |
| `freight_id` | VARCHAR(100) | Freight ID |
| `is_on_hold` | BOOLEAN | Hold 상태 |
| `load_type` | VARCHAR(50) | 로드 유형 |
| `ref_number` | VARCHAR(100) | Ref Number |
| `created_by` | VARCHAR(255) | 생성자 (감사) |
| `last_modified_by` | VARCHAR(255) | 최종 수정자 (감사) |

## 2. shipper_stops / consignee_stops 팔레트 확장
`total_pallets, temperature, gross_value, cubic, weight_stop, width, length, height, contact, appointment, by_time`

## 3. carrier_segments 구간 확장
`equipment, stop_type, bol_date, arrival_date, arrival_time, pu_date, pu_time, seal_tags`

## 4. references BOL 체크박스
`bill_of_lading BOOLEAN`

## 5. 마이그레이션
`016_load_order_expansion` — 총 33개 컬럼 추가

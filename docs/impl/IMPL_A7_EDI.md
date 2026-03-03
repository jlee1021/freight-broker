# A7 — EDI (Electronic Data Interchange)

> **구현일**: 2026-03-03 | **상태**: ✅ 완료

## 데이터 모델
- `edi_configs`: id, name, edi_type, mode(Test/Production), tid, tsi, remarks, is_active, created_at
- `edi_records`: id, edi_config_id, company, report_date, report_type, client, invoice_number, bol_number, po_number, tracking_number, ap_date, sent_by, sent_at, status(pending/sent/failed), tp_number, tp_name, created_at

## API (`/api/v1/edi`)
- `/configs` — CRUD (active_only 필터)
- `/records` — CRUD (company, report_type, status, from_date, to_date 필터)

## UI (`/edi`)
- **EDI Config 탭**: 설정 목록/추가/수정/삭제, Mode 배지 (Test=노랑, Production=초록)
- **EDI List 탭**: 전송 기록 목록 (다중 필터), 상태 배지, 광폭 테이블

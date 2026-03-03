# A3 — Account: ItemType / Expense / ExpenseDetail / DebitCredit

> **구현일**: 2026-03-03  
> **상태**: ✅ 완료  
> **참조 솔루션 대응**: Account_ItemType, Account_Expense, Account_ExpenseDetail, Account_DebitCredit

---

## 1. 구현 개요

Account 페이지에 4개 탭 추가.

| 탭 | 설명 |
|----|------|
| Users | 기존 사용자 관리 (유지) |
| Item Types | 계정 아이템 유형 마스터 CRUD |
| Expense | 비용 항목 CRUD + 우측 ExpenseDetail 패널 |
| Debit / Credit | 차변·대변 기록 CRUD |

---

## 2. 데이터 모델

### item_types
```
id, code, type_name, lvl1, lvl2, dividers, uom, rc(bool), rebate(bool), account_type, is_active, created_at
```

### expenses
```
id, ref_no, item_type_id(FK), bill_to, po_no, memo, expense_date, amount, tax_amount, account, vendor, status(pending/approved/paid), created_by, created_at
```

### expense_details
```
id, expense_id(FK→expenses CASCADE), entry_number, general_account, entry_type, status, accountability, vendor, amount, created_at
```

### debit_credits
```
id, entry_type(debit/credit), reason, debit_amount, credit_amount, customer_code, tax_number, email, note, attachment_url, status, created_at
```

---

## 3. API 엔드포인트

베이스 경로: `/api/v1/account`

| Method | Path | 설명 |
|--------|------|------|
| GET | `/item-types` | 목록 (검색·account_type 필터) |
| POST | `/item-types` | 생성 |
| PATCH | `/item-types/{id}` | 수정 |
| DELETE | `/item-types/{id}` | 삭제 |
| GET | `/expenses` | 목록 (status·vendor 필터) |
| GET | `/expenses/{id}` | 단건 + details 포함 |
| POST | `/expenses` | 생성 |
| PATCH | `/expenses/{id}` | 수정 |
| DELETE | `/expenses/{id}` | 삭제 |
| POST | `/expenses/{id}/details` | 상세 추가 |
| DELETE | `/expenses/details/{id}` | 상세 삭제 |
| GET | `/debit-credits` | 목록 (entry_type·status 필터) |
| POST | `/debit-credits` | 생성 |
| PATCH | `/debit-credits/{id}` | 수정 |
| DELETE | `/debit-credits/{id}` | 삭제 |

---

## 4. UI 특이사항

- **Expense 탭**: 좌측 Expense 목록 + 클릭 시 우측 ExpenseDetail 패널 표시 (split view)
- **DebitCredit**: entry_type별 필터 + 금액 컬러 (Debit=적색, Credit=녹색)
- **ItemType**: RC/Rebate 체크박스, account_type 자유입력

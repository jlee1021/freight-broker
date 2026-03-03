"""
FreightBroker Pro - 확장 API 헬스체크 스크립트 (A1~A7 신규 엔드포인트 포함)
사용법: python check_health_v2.py [BASE_URL]
기본값: http://192.168.111.137:8000/api/v1
"""
import sys
import json
import requests

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://192.168.111.137:8000/api/v1"
EMAIL = "admin@local"
PASSWORD = "admin123"

PASS = "[PASS]"
FAIL = "[FAIL]"
SKIP = "[SKIP]"

results = []


def check(name, ok, detail=""):
    status = PASS if ok else FAIL
    msg = f"{status} {name}"
    if detail:
        msg += f"  ({detail})"
    print(msg)
    results.append((ok, name))
    return ok


def skip(name, reason=""):
    print(f"{SKIP} {name}  ({reason})")


def run():
    print(f"\n=== FreightBroker Pro v2 Health Check (A1-A7 포함) ===")
    print(f"Target: {BASE}\n")

    # ── 기본 연결 체크 ───────────────────────────────────────────────
    try:
        r = requests.get(BASE.replace("/api/v1", "/health"), timeout=5)
        check("Health endpoint", r.status_code == 200)
    except Exception as e:
        check("Health endpoint", False, str(e))
        print("\nServer not reachable. Aborting.")
        return

    # ── 인증 ─────────────────────────────────────────────────────────
    token = None
    try:
        r = requests.post(f"{BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=5)
        check("Login", r.status_code == 200, f"status={r.status_code}")
        token = r.json().get("access_token") if r.status_code == 200 else None
    except Exception as e:
        check("Login", False, str(e))
        return

    if not token:
        print("Login failed. Aborting.")
        return

    H = {"Authorization": f"Bearer {token}"}

    # ── 기존 기능 회귀 ────────────────────────────────────────────────
    print("\n--- 기존 기능 회귀 테스트 ---")
    for name, url, method in [
        ("Auth /me", f"{BASE}/auth/me", "GET"),
        ("Dashboard stats", f"{BASE}/stats/dashboard", "GET"),
        ("Loads list", f"{BASE}/loads", "GET"),
        ("Partners list", f"{BASE}/partners", "GET"),
        ("AR Invoices", f"{BASE}/invoices/customer", "GET"),
        ("AP Payables", f"{BASE}/invoices/carrier", "GET"),
        ("Settings", f"{BASE}/settings", "GET"),
        ("Inventory warehouses", f"{BASE}/inventory/warehouses", "GET"),
        ("Users list", f"{BASE}/users", "GET"),
        ("Loads CSV", f"{BASE}/loads/export/csv", "GET"),
    ]:
        try:
            r = requests.request(method, url, headers=H, timeout=10)
            check(name, r.status_code in [200, 201, 204], f"status={r.status_code}")
        except Exception as e:
            check(name, False, str(e))

    # ── A1: Settings Masters ──────────────────────────────────────────
    print("\n--- A1: Settings Masters ---")
    city_id = None
    try:
        r = requests.get(f"{BASE}/master/cities", headers=H, timeout=5)
        check("City list", r.status_code == 200, f"count={len(r.json())}")
    except Exception as e:
        check("City list", False, str(e))

    try:
        r = requests.post(f"{BASE}/master/cities", headers=H, json={"name": "TestCity", "province": "BC", "country": "CANADA", "timezone": "America/Vancouver"}, timeout=5)
        ok = r.status_code == 201
        check("City create", ok, f"status={r.status_code}")
        if ok:
            city_id = r.json().get("id")
    except Exception as e:
        check("City create", False, str(e))

    if city_id:
        try:
            r = requests.delete(f"{BASE}/master/cities/{city_id}", headers=H, timeout=5)
            check("City delete", r.status_code == 204)
        except Exception as e:
            check("City delete", False, str(e))

    type_id = None
    try:
        r = requests.post(f"{BASE}/master/types", headers=H, json={"type_name": "TestType", "use_subtype": True, "subtypes": [{"subtype_name": "Sub1"}]}, timeout=5)
        ok = r.status_code == 201
        check("Type create", ok)
        if ok:
            type_id = r.json().get("id")
    except Exception as e:
        check("Type create", False, str(e))

    if type_id:
        try:
            r = requests.delete(f"{BASE}/master/types/{type_id}", headers=H, timeout=5)
            check("Type delete", r.status_code == 204)
        except Exception as e:
            check("Type delete", False, str(e))

    perm_id = None
    try:
        import uuid as _uuid
        pname = f"test_perm_{_uuid.uuid4().hex[:6]}"
        r = requests.post(f"{BASE}/master/permissions", headers=H, json={"name": pname, "resource": "loads", "action": "read"}, timeout=5)
        ok = r.status_code == 201
        check("Permission create", ok)
        if ok:
            perm_id = r.json().get("id")
    except Exception as e:
        check("Permission create", False, str(e))

    if perm_id:
        try:
            r = requests.delete(f"{BASE}/master/permissions/{perm_id}", headers=H, timeout=5)
            check("Permission delete", r.status_code == 204)
        except Exception as e:
            check("Permission delete", False, str(e))

    # ── A2: Partner 확장 ─────────────────────────────────────────────
    print("\n--- A2: Partner 확장 ---")
    # 테스트용 파트너 생성
    test_partner_id = None
    try:
        r = requests.post(f"{BASE}/partners", headers=H, json={"name": "_TestPartner_HC", "type": "carrier", "legal_name": "Test Legal Inc.", "hazmat_carrier": False}, timeout=5)
        ok = r.status_code in [200, 201]
        check("Partner create (확장 필드)", ok, f"status={r.status_code}")
        if ok:
            test_partner_id = r.json().get("id")
    except Exception as e:
        check("Partner create", False, str(e))

    if test_partner_id:
        # Location
        try:
            r = requests.post(f"{BASE}/partners/{test_partner_id}/locations", headers=H, json={"name": "Test Location", "city": "Vancouver", "state": "BC"}, timeout=5)
            check("Partner Location create", r.status_code == 201)
        except Exception as e:
            check("Partner Location create", False, str(e))

        # Staff
        try:
            r = requests.post(f"{BASE}/partners/{test_partner_id}/staff", headers=H, json={"full_name": "John Doe", "title": "Manager"}, timeout=5)
            check("Partner Staff create", r.status_code == 201)
        except Exception as e:
            check("Partner Staff create", False, str(e))

        # Contacts
        try:
            r = requests.post(f"{BASE}/partners/{test_partner_id}/contacts", headers=H, json={"name": "Contact One", "department": "Sales"}, timeout=5)
            check("Carrier Contact create", r.status_code == 201)
        except Exception as e:
            check("Carrier Contact create", False, str(e))

        # Vehicles
        try:
            r = requests.post(f"{BASE}/partners/{test_partner_id}/vehicles", headers=H, json={"vehicle_type": "Truck", "vehicle_number": "T-001", "model": "Freightliner"}, timeout=5)
            check("Carrier Vehicle create", r.status_code == 201)
        except Exception as e:
            check("Carrier Vehicle create", False, str(e))

    # ── A3: Account ──────────────────────────────────────────────────
    print("\n--- A3: Account ---")
    item_type_id = None
    try:
        r = requests.post(f"{BASE}/account/item-types", headers=H, json={"type_name": "TestItemType", "code": "TIT", "uom": "each"}, timeout=5)
        ok = r.status_code == 201
        check("ItemType create", ok)
        if ok:
            item_type_id = r.json().get("id")
    except Exception as e:
        check("ItemType create", False, str(e))

    expense_id = None
    try:
        r = requests.post(f"{BASE}/account/expenses", headers=H, json={"ref_no": "EXP-001", "vendor": "ACME Corp", "amount": 1000, "status": "pending"}, timeout=5)
        ok = r.status_code == 201
        check("Expense create", ok)
        if ok:
            expense_id = r.json().get("id")
    except Exception as e:
        check("Expense create", False, str(e))

    if expense_id:
        try:
            r = requests.post(f"{BASE}/account/expenses/{expense_id}/details", headers=H, json={"entry_number": "D-001", "vendor": "ACME", "amount": 500}, timeout=5)
            check("Expense Detail create", r.status_code == 201)
        except Exception as e:
            check("Expense Detail create", False, str(e))

    try:
        r = requests.post(f"{BASE}/account/debit-credits", headers=H, json={"entry_type": "debit", "debit_amount": 500, "customer_code": "CUST-001"}, timeout=5)
        check("DebitCredit create", r.status_code == 201)
    except Exception as e:
        check("DebitCredit create", False, str(e))

    # ── A4: Inventory 확장 ────────────────────────────────────────────
    print("\n--- A4: Inventory 확장 ---")
    try:
        r = requests.get(f"{BASE}/inventory/items", headers=H, timeout=5)
        check("Inventory items all", r.status_code == 200, f"count={len(r.json())}")
    except Exception as e:
        check("Inventory items all", False, str(e))

    # 창고 하나 가져오기
    warehouses = []
    try:
        r = requests.get(f"{BASE}/inventory/warehouses", headers=H, timeout=5)
        warehouses = r.json() if r.status_code == 200 else []
    except Exception:
        pass

    if warehouses:
        wh_id = warehouses[0]["id"]
        try:
            r = requests.post(f"{BASE}/inventory/warehouses/{wh_id}/items", headers=H, json={"name": "TestItem", "sku": "SKU-001", "quantity": 10, "size": "L", "cost": 5.5, "entry_date": "2026-03-01", "note": "Test note"}, timeout=5)
            ok = r.status_code == 201
            check("Inventory item create (확장)", ok, f"total={r.json().get('total')}")
        except Exception as e:
            check("Inventory item create", False, str(e))

    # ── A6: Consolidation ─────────────────────────────────────────────
    print("\n--- A6: Consolidation ---")
    import uuid as _uuid
    con_id = None
    try:
        con_num = f"CON-TEST-{_uuid.uuid4().hex[:4].upper()}"
        r = requests.post(f"{BASE}/consolidations", headers=H, json={"consolidation_number": con_num, "status": "pending", "equipment_type": "Dry Van"}, timeout=5)
        ok = r.status_code == 201
        check("Consolidation create", ok)
        if ok:
            con_id = r.json().get("id")
    except Exception as e:
        check("Consolidation create", False, str(e))

    if con_id:
        try:
            r = requests.post(f"{BASE}/consolidations/{con_id}/shippers", headers=H, json={"name": "Shipper One", "city": "Toronto", "pallet_count": 5, "weight": 1000}, timeout=5)
            check("Consolidation shipper add", r.status_code == 201)
        except Exception as e:
            check("Consolidation shipper add", False, str(e))

        try:
            r = requests.post(f"{BASE}/consolidations/{con_id}/consignees", headers=H, json={"name": "Consignee One", "city": "Vancouver", "pallet_count": 5, "weight": 1000}, timeout=5)
            check("Consolidation consignee add", r.status_code == 201)
        except Exception as e:
            check("Consolidation consignee add", False, str(e))

        try:
            r = requests.get(f"{BASE}/consolidations/{con_id}", headers=H, timeout=5)
            d = r.json()
            check("Consolidation detail (with shippers/consignees)", r.status_code == 200,
                  f"shippers={len(d.get('customer_shippers', []))}, consignees={len(d.get('carrier_consignees', []))}")
        except Exception as e:
            check("Consolidation detail", False, str(e))

    # ── A7: EDI ───────────────────────────────────────────────────────
    print("\n--- A7: EDI ---")
    cfg_id = None
    try:
        r = requests.post(f"{BASE}/edi/configs", headers=H, json={"name": "TestEDI", "edi_type": "204", "mode": "Test", "tid": "SENDER001", "tsi": "RECV001"}, timeout=5)
        ok = r.status_code == 201
        check("EDI Config create", ok)
        if ok:
            cfg_id = r.json().get("id")
    except Exception as e:
        check("EDI Config create", False, str(e))

    try:
        r = requests.post(f"{BASE}/edi/records", headers=H, json={"company": "ABC Trucking", "report_type": "204", "client": "Client A", "invoice_number": "INV-001", "status": "pending"}, timeout=5)
        check("EDI Record create", r.status_code == 201)
    except Exception as e:
        check("EDI Record create", False, str(e))

    try:
        r = requests.get(f"{BASE}/edi/records?status=pending", headers=H, timeout=5)
        check("EDI Records list (filter)", r.status_code == 200, f"count={len(r.json())}")
    except Exception as e:
        check("EDI Records list", False, str(e))

    # ── 정리 (테스트 데이터 삭제) ─────────────────────────────────────
    if test_partner_id:
        try:
            requests.patch(f"{BASE}/partners/{test_partner_id}", headers=H, json={"is_active": False}, timeout=5)
        except Exception:
            pass

    if con_id:
        try:
            requests.delete(f"{BASE}/consolidations/{con_id}", headers=H, timeout=5)
        except Exception:
            pass

    # ── 최종 결과 ─────────────────────────────────────────────────────
    total = len(results)
    passed = sum(1 for ok, _ in results if ok)
    failed = total - passed

    print(f"\n{'='*50}")
    print(f"Result: {passed}/{total} passed", end="")
    if failed:
        print(f"  ({failed} FAILED)")
        print("\nFailed items:")
        for ok, name in results:
            if not ok:
                print(f"  [X] {name}")
    else:
        print("  -- ALL PASS [OK]")
    print(f"{'='*50}\n")

    return failed == 0


if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)

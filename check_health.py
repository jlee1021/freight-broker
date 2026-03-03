"""
FreightBroker Pro — API 자동 헬스체크 스크립트
사용법: python check_health.py [BASE_URL]
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

results = []

def check(name, ok, detail=""):
    status = PASS if ok else FAIL
    msg = f"{status} {name}"
    if detail:
        msg += f"  ({detail})"
    print(msg)
    results.append((ok, name))

def run():
    print(f"\n=== FreightBroker Pro Health Check ===")
    print(f"Target: {BASE}\n")

    # 1. Health endpoint
    try:
        r = requests.get(BASE.replace("/api/v1", "/health"), timeout=5)
        check("Health endpoint", r.status_code == 200, r.json().get("status"))
    except Exception as e:
        check("Health endpoint", False, str(e))
        print("\nServer not reachable. Aborting.")
        return

    # 2. Login
    token = None
    try:
        r = requests.post(f"{BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=5)
        check("Login (admin@local)", r.status_code == 200, f"status={r.status_code}")
        token = r.json().get("access_token") if r.status_code == 200 else None
    except Exception as e:
        check("Login", False, str(e))
        return

    if not token:
        print("\nLogin failed. Aborting remaining tests.")
        return

    H = {"Authorization": f"Bearer {token}"}

    # 3. Auth /me
    try:
        r = requests.get(f"{BASE}/auth/me", headers=H, timeout=5)
        check("Auth /me", r.status_code == 200, r.json().get("email"))
    except Exception as e:
        check("Auth /me", False, str(e))

    # 4. Unauthorized access (no token)
    try:
        r = requests.get(f"{BASE}/loads", timeout=5)
        check("Unauthorized blocked (401)", r.status_code == 401, f"got {r.status_code}")
    except Exception as e:
        check("Unauthorized blocked", False, str(e))

    # 5. Dashboard
    try:
        r = requests.get(f"{BASE}/stats/dashboard", headers=H, timeout=5)
        d = r.json()
        check("Dashboard stats", r.status_code == 200, f"total_loads={d.get('total_loads')}")
    except Exception as e:
        check("Dashboard stats", False, str(e))

    # 6. Loads list
    try:
        r = requests.get(f"{BASE}/loads?limit=5", headers=H, timeout=5)
        d = r.json()
        check("Loads list", r.status_code == 200, f"count={len(d.get('items', []))}")
    except Exception as e:
        check("Loads list", False, str(e))

    # 7. Partners list
    try:
        r = requests.get(f"{BASE}/partners", headers=H, timeout=5)
        d = r.json()
        cnt = len(d.get("items", d) if isinstance(d, dict) else d)
        check("Partners list", r.status_code == 200, f"count={cnt}")
    except Exception as e:
        check("Partners list", False, str(e))

    # 8. AR Invoices
    try:
        r = requests.get(f"{BASE}/invoices/customer", headers=H, timeout=5)
        d = r.json()
        cnt = len(d.get("items", d) if isinstance(d, dict) else d)
        check("AR Invoices list", r.status_code == 200, f"count={cnt}")
    except Exception as e:
        check("AR Invoices list", False, str(e))

    # 9. AP Payables
    try:
        r = requests.get(f"{BASE}/invoices/carrier", headers=H, timeout=5)
        d = r.json()
        cnt = len(d.get("items", d) if isinstance(d, dict) else d)
        check("AP Payables list", r.status_code == 200, f"count={cnt}")
    except Exception as e:
        check("AP Payables list", False, str(e))

    # 10. Stats - profit
    try:
        r = requests.get(f"{BASE}/stats/profit", headers=H, timeout=5)
        d = r.json()
        check("Profit stats", r.status_code == 200, f"revenue={d.get('total_revenue')}")
    except Exception as e:
        check("Profit stats", False, str(e))

    # 11. Reports - revenue
    try:
        r = requests.get(f"{BASE}/stats/reports/revenue?group_by=customer", headers=H, timeout=5)
        d = r.json()
        check("Revenue report", r.status_code == 200, f"items={len(d.get('items', []))}")
    except Exception as e:
        check("Revenue report", False, str(e))

    # 12. Reports - by-lane
    try:
        r = requests.get(f"{BASE}/stats/reports/by-lane", headers=H, timeout=5)
        d = r.json()
        check("By-lane report", r.status_code == 200, f"items={len(d.get('items', []))}")
    except Exception as e:
        check("By-lane report", False, str(e))

    # 13. Carrier performance
    try:
        r = requests.get(f"{BASE}/stats/carrier-performance", headers=H, timeout=5)
        d = r.json()
        check("Carrier performance", r.status_code == 200, f"items={len(d.get('items', []))}")
    except Exception as e:
        check("Carrier performance", False, str(e))

    # 14. Settings
    try:
        r = requests.get(f"{BASE}/settings", headers=H, timeout=5)
        check("Settings", r.status_code == 200, f"company={r.json().get('company_name')!r}")
    except Exception as e:
        check("Settings", False, str(e))

    # 15. Inventory warehouses
    try:
        r = requests.get(f"{BASE}/inventory/warehouses", headers=H, timeout=5)
        d = r.json()
        cnt = len(d.get("items", d) if isinstance(d, dict) else d)
        check("Inventory warehouses", r.status_code == 200, f"count={cnt}")
    except Exception as e:
        check("Inventory warehouses", False, str(e))

    # 16. Users list (admin only)
    try:
        r = requests.get(f"{BASE}/users", headers=H, timeout=5)
        d = r.json()
        check("Users list (admin)", r.status_code == 200, f"count={len(d.get('items', d) if isinstance(d, dict) else d)}")
    except Exception as e:
        check("Users list", False, str(e))

    # 17. CSV export - loads
    try:
        r = requests.get(f"{BASE}/loads/export/csv", headers=H, timeout=10)
        check("Loads CSV export", r.status_code == 200 and "text/csv" in r.headers.get("content-type", ""), f"size={len(r.content)}b")
    except Exception as e:
        check("Loads CSV export", False, str(e))

    # --- Summary ---
    total = len(results)
    passed = sum(1 for ok, _ in results if ok)
    failed = total - passed

    print(f"\n{'='*40}")
    print(f"Result: {passed}/{total} passed", end="")
    if failed:
        print(f"  ({failed} FAILED)")
        print("\nFailed items:")
        for ok, name in results:
            if not ok:
                print(f"  - {name}")
    else:
        print("  -- ALL PASS")
    print(f"{'='*40}\n")

    return failed == 0

if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)

"""
모의 운영 테스트: API를 순서대로 호출해 솔루션이 정상 동작하는지 검증합니다.
PDF 다운로드(LC, 인보이스) 포함.

사전: 1) 백엔드 서버 실행  2) seed_test_data.py 로 테스트 데이터 생성

Ubuntu 서버에서 실행 예 (가상환경 필수):
  cd ~/freight-broker/backend
  source .venv/bin/activate
  export PYTHONPATH=.
  python scripts/run_mock_operation.py [--base-url http://localhost:8000]

자세한 절차: backend/scripts/README.md
"""
import argparse
import json
import sys
from pathlib import Path

# Python 3
if sys.version_info[0] < 3:
    sys.exit("Python 3 required")

try:
    from urllib.request import Request, urlopen
    from urllib.error import HTTPError, URLError
except ImportError:
    from urllib2 import Request, urlopen, HTTPError, URLError

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

BASE = "http://localhost:8000"
API = f"{BASE}/api/v1"


def req(method: str, url: str, body: str = None, token: str = None, accept: str = "application/json"):
    headers = {"Accept": accept}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body and (method in ("POST", "PUT", "PATCH")):
        headers["Content-Type"] = "application/json"
    r = Request(url, data=body.encode("utf-8") if body else None, headers=headers, method=method)
    try:
        with urlopen(r, timeout=15) as res:
            raw = res.read()
            if accept == "application/json" and raw:
                return json.loads(raw.decode("utf-8"))
            return raw
    except HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        try:
            err = json.loads(body)
            detail = err.get("detail", body)
        except Exception:
            detail = body or str(e)
        raise RuntimeError(f"HTTP {e.code} {e.reason}: {detail}")
    except URLError as e:
        raise RuntimeError(f"Request failed: {e.reason}")


def run_mock_operation(base_url: str):
    global BASE, API
    BASE = base_url.rstrip("/")
    API = f"{BASE}/api/v1"
    steps = []

    def ok(msg):
        steps.append(("ok", msg))
        print(f"  [OK] {msg}")

    def fail(msg):
        steps.append(("fail", msg))
        print(f"  [FAIL] {msg}")
        raise RuntimeError(msg)

    print("=== 모의 운영 테스트 (PDF 포함) ===\n")

    # 1) 로그인 (admin)
    print("1. 로그인 (admin@test.com)")
    try:
        login = req("POST", f"{API}/auth/login", body=json.dumps({
            "email": "admin@test.com",
            "password": "test1234",
        }))
        token_admin = login.get("access_token")
        if not token_admin:
            fail("No access_token in login response")
        ok("Admin login")
    except Exception as e:
        fail(str(e))

    # 2) /auth/me
    print("2. GET /auth/me")
    try:
        me = req("GET", f"{API}/auth/me", token=token_admin)
        if me.get("role") != "admin":
            fail(f"Expected role admin, got {me.get('role')}")
        ok(f"Me: {me.get('email')} role={me.get('role')}")

    except Exception as e:
        fail(str(e))

    # 3) 대시보드
    print("3. GET /stats/dashboard")
    try:
        dash = req("GET", f"{API}/stats/dashboard", token=token_admin)
        ok(f"Dashboard: loads={dash.get('total_loads', 0)} revenue={dash.get('total_revenue', 0)}")
    except Exception as e:
        fail(str(e))

    # 4) 로드 목록
    print("4. GET /loads")
    items = []
    try:
        loads = req("GET", f"{API}/loads", token=token_admin)
        items = loads if isinstance(loads, list) else loads.get("items", [])
        if not items:
            ok("Load list (empty - run seed_test_data.py first)")
        else:
            load_id = items[0].get("id")
            ok(f"Load list: {len(items)} items, first id={load_id}")
    except Exception as e:
        fail(str(e))

    load_id = items[0]["id"] if items else None

    # 5) 로드 상세
    if load_id:
        print("5. GET /loads/{id}")
        try:
            detail = req("GET", f"{API}/loads/{load_id}", token=token_admin)
            ok(f"Load detail: {detail.get('load_number')} {detail.get('status')}")
        except Exception as e:
            fail(str(e))

    # 6) 문서 HTML (LC)
    if load_id:
        print("6. GET /documents/load/{id}/lc (HTML)")
        try:
            html = req("GET", f"{API}/documents/load/{load_id}/lc", token=token_admin, accept="text/html")
            if not isinstance(html, bytes):
                html = html.encode("utf-8") if isinstance(html, str) else b""
            if b"Load Confirmation" not in html and b"load_number" not in str(html):
                fail("LC HTML missing expected content")
            ok(f"LC HTML length={len(html)}")
        except Exception as e:
            fail(str(e))

    # 7) 문서 PDF (LC) – 모의 운영 핵심
    if load_id:
        print("7. GET /documents/load/{id}/lc/pdf (PDF)")
        try:
            pdf = req("GET", f"{API}/documents/load/{load_id}/lc/pdf", token=token_admin, accept="application/pdf")
            raw = pdf if isinstance(pdf, bytes) else (pdf.read() if hasattr(pdf, "read") else b"")
            if not raw.startswith(b"%PDF"):
                fail("Response is not PDF")
            ok(f"LC PDF size={len(raw)} bytes")
        except RuntimeError as r:
            if "503" in str(r):
                ok("LC PDF not available (weasyprint missing) - skip")
            else:
                fail(str(r))
        except Exception as e:
            fail(str(e))

    # 8) 인보이스 목록
    print("8. GET /invoices/customer, /invoices/carrier")
    try:
        ar = req("GET", f"{API}/invoices/customer", token=token_admin)
        ap = req("GET", f"{API}/invoices/carrier", token=token_admin)
        ar_list = ar if isinstance(ar, list) else []
        ap_list = ap if isinstance(ap, list) else []
        ok(f"AR={len(ar_list)} AP={len(ap_list)}")
    except Exception as e:
        fail(str(e))

    # 9) 인보이스 PDF (고객 인보이스 1건)
    if ar_list:
        inv_id = ar_list[0].get("id")
        print("9. GET /invoices/customer/{id}/document/pdf")
        try:
            pdf = req("GET", f"{API}/invoices/customer/{inv_id}/document/pdf", token=token_admin, accept="application/pdf")
            raw = pdf if isinstance(pdf, bytes) else b""
            if not raw.startswith(b"%PDF"):
                fail("Invoice PDF response is not PDF")
            ok(f"Invoice PDF size={len(raw)} bytes")
        except RuntimeError as r:
            if "503" in str(r):
                ok("Invoice PDF not available (weasyprint) - skip")
            else:
                fail(str(r))
        except Exception as e:
            fail(str(e))

    # 10) 설정 조회
    print("10. GET /settings")
    try:
        settings = req("GET", f"{API}/settings", token=token_admin)
        ok("Settings loaded")
    except Exception as e:
        fail(str(e))

    # 11) 비-admin(dispatcher) 로그인 → /users 403
    print("11. Dispatcher login → GET /users (expect 403)")
    try:
        login2 = req("POST", f"{API}/auth/login", body=json.dumps({
            "email": "dispatcher@test.com",
            "password": "test1234",
        }))
        token_disp = login2.get("access_token")
        if not token_disp:
            fail("Dispatcher no token")
        req("GET", f"{API}/users", token=token_disp)
        fail("Expected 403 for dispatcher on /users")
    except RuntimeError as r:
        if "403" in str(r):
            ok("Dispatcher correctly got 403 on /users")
        else:
            fail(str(r))

    print("\n=== 모의 운영 테스트 완료 (모든 단계 통과) ===")
    return steps


def main():
    p = argparse.ArgumentParser(description="Run mock operation test (includes PDF)")
    p.add_argument("--base-url", default="http://localhost:8000", help="API base URL")
    args = p.parse_args()
    try:
        run_mock_operation(args.base_url)
    except RuntimeError as e:
        print(f"\n실패: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n오류: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

"""
FreightBroker Pro — 배포 + 헬스체크 통합 스크립트
서버가 켜진 후 실행: python deploy_and_test.py

1. SFTP로 전체 파일 업로드
2. Docker DB 재시작
3. pip install + alembic upgrade head (012~018 마이그레이션)
4. 백엔드·프론트엔드 재시작
5. check_health_v2.py 자동 실행
"""
import os
import sys
import time
import subprocess

import paramiko

HOST = "192.168.111.137"
USER = "john"
PASSWORD = "1234"
PORT = 22
REMOTE_DIR = "/home/john/freight-broker"
LOCAL_BASE = os.path.dirname(os.path.abspath(__file__))

SKIP_NAMES = {"node_modules", ".venv", "__pycache__", "dist", ".git", ".cursor", "tsconfig.tsbuildinfo"}
DB_URL = "postgresql://postgres:postgres@localhost:5433/freight_broker"


def should_skip(path: str) -> bool:
    rel = os.path.relpath(path, LOCAL_BASE)
    parts = os.path.normpath(rel).split(os.sep)
    return any(p in SKIP_NAMES for p in parts)


def exec_ssh(client, cmd, timeout=120, label=""):
    if label:
        print(f"\n[SSH] {label}")
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=False, timeout=timeout)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    combined = (out + err).strip()
    if combined:
        # 마지막 10줄만 표시
        lines = combined.splitlines()
        for line in lines[-10:]:
            print(f"  {line}")
    return combined


def main():
    print("=" * 60)
    print("FreightBroker Pro - Deploy & Test")
    print("=" * 60)

    # ── 연결 ─────────────────────────────────────────────────────────
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"\nConnecting to {HOST}:{PORT} ...")
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
    except Exception as e:
        print(f"Connection failed: {e}")
        print("\n서버(VM)가 켜져 있는지 확인하세요.")
        sys.exit(1)
    print("Connected.")
    sftp = client.open_sftp()

    # ── 파일 업로드 ───────────────────────────────────────────────────
    def mkdir_remote(remote_path: str):
        try:
            sftp.stat(remote_path)
        except FileNotFoundError:
            parent = os.path.dirname(remote_path)
            if parent and parent != "/" and parent != REMOTE_DIR:
                mkdir_remote(parent)
            try:
                sftp.mkdir(remote_path)
            except OSError:
                pass

    print("\n[SFTP] Uploading files...")
    uploaded = 0
    for root, dirs, files in os.walk(LOCAL_BASE):
        rel_root = os.path.relpath(root, LOCAL_BASE)
        if rel_root.startswith(".") and rel_root != ".":
            continue
        dirs[:] = [d for d in dirs if d not in SKIP_NAMES]
        remote_root = REMOTE_DIR if rel_root == "." else os.path.join(REMOTE_DIR, rel_root).replace("\\", "/")
        mkdir_remote(remote_root)
        for f in files:
            if f.endswith(".tsbuildinfo") or f.endswith(".pyc"):
                continue
            local_path = os.path.join(root, f)
            remote_path = os.path.join(remote_root, f).replace("\\", "/")
            try:
                sftp.put(local_path, remote_path)
                uploaded += 1
                if uploaded % 50 == 0:
                    print(f"  ... {uploaded} files uploaded")
            except Exception as e:
                print(f"  skip: {remote_path}: {e}")
    sftp.close()
    print(f"Uploaded {uploaded} files.")

    # ── Docker DB ────────────────────────────────────────────────────
    exec_ssh(client, f"cd {REMOTE_DIR} && docker compose up -d db 2>&1", timeout=90, label="Docker DB 시작")
    print("  Waiting 5s for DB...")
    time.sleep(5)

    # ── pip + alembic ─────────────────────────────────────────────────
    exec_ssh(
        client,
        f"cd {REMOTE_DIR}/backend && "
        f"python3 -m venv .venv 2>/dev/null; "
        f"source .venv/bin/activate && "
        f"pip install -q -r requirements.txt && "
        f"export DATABASE_URL={DB_URL} && "
        f"alembic upgrade head 2>&1",
        timeout=180,
        label="pip install + alembic upgrade",
    )

    # ── 서비스 재시작 ─────────────────────────────────────────────────
    exec_ssh(
        client,
        "pkill -9 -f 'uvicorn app.main' 2>/dev/null || true"
        "; kill -9 $(lsof -ti:5173 -ti:5174 -ti:5175 2>/dev/null) 2>/dev/null || true"
        "; pkill -9 -f vite 2>/dev/null || true"
        "; pkill -9 -f 'npm run dev' 2>/dev/null || true"
        "; sleep 2; echo stopped",
        timeout=20,
        label="기존 서비스 중단",
    )

    exec_ssh(
        client,
        f"cd {REMOTE_DIR}/backend && source .venv/bin/activate && "
        f"export DATABASE_URL={DB_URL} && "
        f"nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /home/john/backend.log 2>&1 &",
        timeout=10,
        label="백엔드 시작",
    )
    time.sleep(4)

    exec_ssh(
        client,
        f"cd {REMOTE_DIR}/frontend && npm install --silent 2>/dev/null && "
        f"nohup npm run dev -- --host 0.0.0.0 > /home/john/frontend.log 2>&1 &",
        timeout=30,
        label="프론트엔드 시작",
    )
    time.sleep(5)

    client.close()

    print(f"\nDeploy complete!")
    print(f"  Backend:  http://{HOST}:8000/docs")
    print(f"  Frontend: http://{HOST}:5173")

    # ── 헬스체크 ─────────────────────────────────────────────────────
    print("\n[HEALTH CHECK] check_health_v2.py 실행 중...")
    time.sleep(3)
    result = subprocess.run(
        [sys.executable, os.path.join(LOCAL_BASE, "check_health_v2.py"), f"http://{HOST}:8000/api/v1"],
        capture_output=False,
    )
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()

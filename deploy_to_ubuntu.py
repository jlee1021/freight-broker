"""
Deploy freight-broker to Ubuntu server via SFTP + SSH.
Excludes: node_modules, .venv, __pycache__, dist, .git
"""
import os
import paramiko
import sys

HOST = "192.168.111.137"
USER = "john"
PASSWORD = "1234"
PORT = 22
REMOTE_DIR = "/home/john/freight-broker"
LOCAL_BASE = os.path.dirname(os.path.abspath(__file__))

SKIP_NAMES = {"node_modules", ".venv", "__pycache__", "dist", ".git", ".cursor", "tsconfig.tsbuildinfo"}


def should_skip(path: str) -> bool:
    rel = os.path.relpath(path, LOCAL_BASE)
    parts = os.path.normpath(rel).split(os.sep)
    return any(p in SKIP_NAMES for p in parts)


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting...")
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
    sftp = client.open_sftp()

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

    uploaded = 0
    for root, dirs, files in os.walk(LOCAL_BASE):
        if "deploy_to_ubuntu.py" in root:
            continue
        rel_root = os.path.relpath(root, LOCAL_BASE)
        if rel_root.startswith(".") and rel_root != ".":
            continue
        dirs[:] = [d for d in dirs if d not in SKIP_NAMES]
        remote_root = REMOTE_DIR if rel_root == "." else os.path.join(REMOTE_DIR, rel_root).replace("\\", "/")
        mkdir_remote(remote_root)
        for f in files:
            if f.endswith(".tsbuildinfo"):
                continue
            local_path = os.path.join(root, f)
            remote_path = os.path.join(remote_root, f).replace("\\", "/")
            try:
                sftp.put(local_path, remote_path)
                uploaded += 1
                if uploaded % 50 == 0:
                    print(f"  uploaded {uploaded} files...")
            except Exception as e:
                print(f"  skip/err {remote_path}: {e}")
    print(f"Uploaded {uploaded} files.")
    sftp.close()

    # Run on server: db on host port 5433 to avoid conflict with existing 5432
    print("Running on server: docker compose down; docker compose up -d db ...")
    stdin, stdout, stderr = client.exec_command(
        f"cd {REMOTE_DIR} && docker compose down 2>/dev/null; docker compose up -d db 2>&1",
        get_pty=False,
        timeout=90,
    )
    out = stdout.read().decode()
    err = stderr.read().decode()
    print(out or err)

    # Wait for postgres to accept connections
    import time
    time.sleep(5)

    DB_URL = "postgresql://postgres:postgres@localhost:5433/freight_broker"
    print("Running alembic upgrade ...")
    stdin, stdout, stderr = client.exec_command(
        f"cd {REMOTE_DIR}/backend && python3 -m venv .venv 2>/dev/null; "
        f"source .venv/bin/activate && pip install -q -r requirements.txt && "
        f"export DATABASE_URL={DB_URL} && "
        f"alembic upgrade head 2>&1",
        get_pty=False,
        timeout=120,
    )
    out = stdout.read().decode()
    err = stderr.read().decode()
    print(out or err)

    print("Stopping old backend and frontend...")
    stdin, stdout, stderr = client.exec_command(
        "pkill -9 -f 'uvicorn app.main' 2>/dev/null || true"
        "; kill -9 $(lsof -ti:5173 -ti:5174 -ti:5175 2>/dev/null) 2>/dev/null || true"
        "; pkill -9 -f vite 2>/dev/null || true"
        "; pkill -9 -f 'npm run dev' 2>/dev/null || true"
        "; sleep 3; echo done",
        get_pty=False,
        timeout=15,
    )
    stdout.read()

    print("Starting backend (uvicorn in background) ...")
    client.exec_command(
        f"cd {REMOTE_DIR}/backend && source .venv/bin/activate && "
        f"nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /home/john/backend.log 2>&1 &",
        get_pty=False,
    )
    time.sleep(3)

    print("Installing frontend deps and starting dev server (background) ...")
    client.exec_command(
        f"cd {REMOTE_DIR}/frontend && npm install --silent 2>/dev/null && "
        f"nohup npm run dev > /home/john/frontend.log 2>&1 &",
        get_pty=False,
        timeout=90,
    )

    client.close()
    print("Done.")
    print(f"  Backend:  http://{HOST}:8000  (docs: http://{HOST}:8000/docs)")
    print(f"  Frontend: http://{HOST}:5173")
    print("  Logs: ~/backend.log, ~/frontend.log")


if __name__ == "__main__":
    main()

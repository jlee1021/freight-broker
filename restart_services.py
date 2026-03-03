"""Uploaded code already on server - just restart backend and frontend."""
import paramiko
import time

HOST = "192.168.111.137"
USER = "john"
PASSWORD = "1234"
PORT = 22

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=10)

def run(cmd, label, timeout=15):
    print(f"[SSH] {label}")
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    try:
        out = stdout.read().decode(errors="replace")
        if out.strip():
            for line in out.strip().splitlines()[:20]:
                print(f"  {line}")
    except Exception as e:
        print(f"  (timeout or error: {e})")

# Kill existing
run("pkill -f uvicorn 2>/dev/null; pkill -f 'vite' 2>/dev/null; sleep 2", "Kill old processes")

# Backend
run(
    "cd /home/john/freight-broker/backend && source .venv/bin/activate && "
    "export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/freight_broker && "
    "nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /home/john/backend.log 2>&1 &",
    "Start backend"
)
time.sleep(4)

# Frontend (background, no wait)
run(
    "cd /home/john/freight-broker/frontend && nohup npm run dev -- --host 0.0.0.0 > /home/john/frontend.log 2>&1 &",
    "Start frontend",
    timeout=5
)
time.sleep(3)

run("pgrep -fa uvicorn || echo no uvicorn", "Backend check")
run("pgrep -fa vite || echo no vite", "Frontend check")

c.close()
print("Done. Frontend may take 30-60s to be ready (npm run dev).")

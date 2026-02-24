"""Restart backend and frontend on Ubuntu server after deploy."""
import paramiko
import time

HOST = "192.168.111.137"
USER = "john"
PASSWORD = "1234"
REMOTE = "/home/john/freight-broker"
DB_URL = "postgresql://postgres:postgres@localhost:5433/freight_broker"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=10)

def run(cmd, timeout=15):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode() + stderr.read().decode()

print("Stopping old backend and frontend...")
run("pkill -f 'uvicorn app.main' 2>/dev/null; pkill -f 'node.*vite' 2>/dev/null; sleep 2")
print("Starting backend...")
run(f"cd {REMOTE}/backend && source .venv/bin/activate && export DATABASE_URL={DB_URL} && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /home/john/backend.log 2>&1 &")
time.sleep(2)
print("Starting frontend...")
run(f"cd {REMOTE}/frontend && nohup npm run dev >> /home/john/frontend.log 2>&1 &")
time.sleep(5)
print("Checking ports...")
out = run("ss -tlnp 2>/dev/null | grep -E '8000|5173'")
print(out or "(none)")
client.close()
print("Done. Backend: http://192.168.111.137:8000  Frontend: http://192.168.111.137:5173")

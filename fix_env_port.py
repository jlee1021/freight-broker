"""VM 서버 .env PORT 수정 (5432 → 5433) 및 SECRET_KEY 확인"""
import paramiko

HOST = "192.168.111.137"
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="john", password="1234")

ENV_PATH = "/home/john/freight-broker/backend/.env"

# 현재 .env 읽기
_, stdout, _ = client.exec_command(f"cat {ENV_PATH}")
current = stdout.read().decode()
print("Current .env:")
print(current)
print("---")

# 포트 수정 + SECRET_KEY 보장
lines = current.splitlines()
new_lines = []
for line in lines:
    if line.startswith("DATABASE_URL=") and "5432" in line and "5433" not in line:
        line = line.replace(":5432/", ":5433/")
        print(f"Fixed DATABASE_URL: {line}")
    new_lines.append(line)

# SECRET_KEY 없으면 추가
if not any(l.startswith("SECRET_KEY=") for l in new_lines):
    new_lines.append("SECRET_KEY=m6iKiUtlscyMNUmD3COyu24-08rptQ_cx5O-1TvNrr9MmiB4tVpZiH8nsaqO_bvI_unMUM77WiU9yNRXXgnYVA")

# CORS 없으면 추가
if not any(l.startswith("CORS_ORIGINS=") for l in new_lines):
    new_lines.append(f"CORS_ORIGINS=http://{HOST}:5173,http://localhost:5173")

new_content = "\n".join(new_lines).strip() + "\n"
sftp = client.open_sftp()
with sftp.open(ENV_PATH, "w") as f:
    f.write(new_content)
sftp.close()
print("Updated .env:")
print(new_content)

# 백엔드 재시작
_, stdout, _ = client.exec_command(
    "pkill -9 -f uvicorn; sleep 2; "
    "cd /home/john/freight-broker && source backend/.venv/bin/activate && "
    "nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir backend >> backend.log 2>&1 &"
)
stdout.channel.recv_exit_status()
print("Backend restarted")
client.close()

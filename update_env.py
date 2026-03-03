"""VM 서버의 .env SECRET_KEY / CORS_ORIGINS 업데이트"""
import paramiko
import secrets

HOST = "192.168.111.137"
USER = "john"
PASSWORD = "1234"
ENV_PATH = "/home/john/freight-broker/backend/.env"

NEW_SECRET = "m6iKiUtlscyMNUmD3COyu24-08rptQ_cx5O-1TvNrr9MmiB4tVpZiH8nsaqO_bvI_unMUM77WiU9yNRXXgnYVA"
NEW_CORS = f"http://{HOST}:5173,http://localhost:5173"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD)

# 현재 .env 읽기
_, stdout, _ = client.exec_command(f"cat {ENV_PATH} 2>/dev/null || echo ''")
current = stdout.read().decode()

# SECRET_KEY, CORS_ORIGINS 교체 또는 추가
lines = current.splitlines()
updated = {}
new_lines = []
for line in lines:
    if line.startswith("SECRET_KEY="):
        new_lines.append(f"SECRET_KEY={NEW_SECRET}")
        updated["SECRET_KEY"] = True
    elif line.startswith("CORS_ORIGINS="):
        new_lines.append(f"CORS_ORIGINS={NEW_CORS}")
        updated["CORS_ORIGINS"] = True
    else:
        new_lines.append(line)

if "SECRET_KEY" not in updated:
    new_lines.append(f"SECRET_KEY={NEW_SECRET}")
if "CORS_ORIGINS" not in updated:
    new_lines.append(f"CORS_ORIGINS={NEW_CORS}")

new_content = "\n".join(new_lines).strip() + "\n"

# 파일 쓰기
sftp = client.open_sftp()
with sftp.open(ENV_PATH, "w") as f:
    f.write(new_content)
sftp.close()

print(f"[OK] .env updated on {HOST}")
print(f"     SECRET_KEY: {NEW_SECRET[:20]}...")
print(f"     CORS_ORIGINS: {NEW_CORS}")

# 백엔드 재시작
_, stdout, stderr = client.exec_command(
    "cd /home/john/freight-broker && pkill -9 -f uvicorn; sleep 2; "
    "source backend/.venv/bin/activate && "
    "nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir backend > ~/backend.log 2>&1 &"
)
stdout.channel.recv_exit_status()
print("[OK] Backend restarted")
client.close()

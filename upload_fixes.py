"""수정된 파일 업로드 및 백엔드 재시작."""
import paramiko
import time

HOST = "192.168.111.137"
USER = "john"
PASSWORD = "1234"
PORT = 22

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=10)
print("Connected.")

sftp = c.open_sftp()
files = [
    (
        r"C:\Users\jonghun.lee\freight-broker\backend\app\models\partner.py",
        "/home/john/freight-broker/backend/app/models/partner.py",
    ),
    (
        r"C:\Users\jonghun.lee\freight-broker\backend\app\api\routes\inventory.py",
        "/home/john/freight-broker/backend/app/api/routes/inventory.py",
    ),
]
for local, remote in files:
    sftp.put(local, remote)
    print(f"Uploaded: {remote.split('/')[-1]}")
sftp.close()

# 기존 uvicorn 종료
stdin, stdout, stderr = c.exec_command("pkill -f uvicorn; sleep 2")
stdout.channel.recv_exit_status()
print("Old process killed.")

# 재시작
cmd = (
    "cd /home/john/freight-broker/backend && "
    "source .venv/bin/activate && "
    "export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/freight_broker && "
    "nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /home/john/backend.log 2>&1 &"
)
c.exec_command(cmd)
print("Backend starting...")
time.sleep(6)

stdin, stdout, stderr = c.exec_command("pgrep -f uvicorn && echo RUNNING || echo NOT_RUNNING")
print("Status:", stdout.read().decode().strip())

stdin, stdout, stderr = c.exec_command("tail -5 /home/john/backend.log")
print("Last log:", stdout.read().decode(errors="replace").strip())

c.close()
print("Done.")

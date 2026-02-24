"""Upload vite.config.ts and restart frontend with --host 0.0.0.0"""
import paramiko
import os

HOST = "192.168.111.137"
USER = "john"
PASSWORD = "1234"
REMOTE_DIR = "/home/john/freight-broker"
LOCAL = os.path.join(os.path.dirname(__file__), "frontend", "vite.config.ts")
REMOTE = f"{REMOTE_DIR}/frontend/vite.config.ts"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=10)
sftp = client.open_sftp()
sftp.put(LOCAL, REMOTE)
sftp.close()
print("Uploaded vite.config.ts")

# Kill existing vite and start with host 0.0.0.0
client.exec_command("pkill -f 'node.*vite' 2>/dev/null; sleep 1; cd /home/john/freight-broker/frontend && nohup npm run dev > /home/john/frontend.log 2>&1 &")
print("Restarted frontend (Vite now binds to 0.0.0.0)")
client.close()

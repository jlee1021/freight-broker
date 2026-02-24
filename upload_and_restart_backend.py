import paramiko
import os
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("192.168.111.137", username="john", password="1234", timeout=10)
sftp = c.open_sftp()
sftp.put(os.path.join(os.path.dirname(__file__), "backend", "app", "main.py"), "/home/john/freight-broker/backend/app/main.py")
sftp.close()
c.exec_command("pkill -f 'uvicorn app.main' 2>/dev/null; sleep 2")
c.exec_command("cd /home/john/freight-broker/backend && source .venv/bin/activate && export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/freight_broker && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 >> /home/john/backend.log 2>&1 &", timeout=3)
c.close()
print("Uploaded main.py and restarted backend.")

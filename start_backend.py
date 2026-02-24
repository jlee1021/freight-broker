import paramiko
HOST, USER, PASSWORD = "192.168.111.137", "john", "1234"
REMOTE = "/home/john/freight-broker"
DB_URL = "postgresql://postgres:postgres@localhost:5433/freight_broker"
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=10)
cmd = f"cd {REMOTE}/backend && source .venv/bin/activate && export DATABASE_URL={DB_URL} && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /home/john/backend.log 2>&1 &"
client.exec_command(cmd, timeout=3)
client.close()
print("Backend start command sent.")

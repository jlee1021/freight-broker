import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.111.137", port=22, username="john", password="1234", timeout=10)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
    return stdout.read().decode() + stderr.read().decode()

print("=== Processes (uvicorn / vite) ===")
print(run("ps aux | grep -E 'uvicorn|vite' | grep -v grep"))
print("=== Ports 8000, 5173 ===")
print(run("ss -tlnp 2>/dev/null | grep -E '8000|5173' || netstat -tlnp 2>/dev/null | grep -E '8000|5173'"))
print("=== Backend log (last 15 lines) ===")
print(run("tail -15 /home/john/backend.log 2>/dev/null"))
print("=== Frontend log (last 15 lines) ===")
print(run("tail -15 /home/john/frontend.log 2>/dev/null"))
print("=== Curl health from server ===")
print(run("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/health 2>/dev/null || echo 'curl failed'"))

client.close()

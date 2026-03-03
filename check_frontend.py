"""프론트엔드 상태 확인."""
import paramiko

HOST = "192.168.111.137"
USER = "john"
PASSWORD = "1234"
PORT = 22

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=10)

_, out, _ = c.exec_command("pgrep -fa vite || echo NOT_RUNNING")
print("Frontend (vite):", out.read().decode().strip())

_, out, _ = c.exec_command("pgrep -fa node | head -5")
print("Node processes:", out.read().decode().strip())

_, out, _ = c.exec_command("tail -20 /home/john/frontend.log 2>/dev/null || echo NO_LOG")
print("\nFrontend log:")
log_text = out.read().decode(errors="replace").strip()
print(log_text.encode("cp949", errors="replace").decode("cp949"))

# 포트 확인
_, out, _ = c.exec_command("ss -tlnp | grep -E '5173|3000|4173'")
print("\nFrontend ports:", out.read().decode().strip() or "NONE")

c.close()

import paramiko
import time
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("192.168.111.137", username="john", password="1234", timeout=10)
time.sleep(3)
i, o, e = c.exec_command("ss -tlnp 2>/dev/null | grep -E '5173|8000'")
out = o.read().decode()
print(out or "(no match)")
c.close()

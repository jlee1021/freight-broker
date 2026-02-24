import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("192.168.111.137", username="john", password="1234", timeout=10)
i, o, e = c.exec_command("tail -50 /home/john/backend.log 2>/dev/null")
print(o.read().decode())
c.close()

"""Open firewall ports 8000 and 5173 on Ubuntu server (ufw)."""
import paramiko

HOST = "192.168.111.137"
USER = "john"
PASSWORD = "1234"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=10)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out or err

# Ensure SSH stays allowed so we don't lock out
print("=== Current ufw status ===")
print(run("sudo -n ufw status 2>/dev/null || sudo ufw status 2>/dev/null"))

# Use sudo -S to read password from stdin (if sudo requires it)
pw = PASSWORD
print("\n=== Allowing 8000/tcp, 5173/tcp ===")
stdin, stdout, stderr = client.exec_command(
    f"echo '{pw}' | sudo -S ufw allow 8000/tcp comment 'Freight Broker API' 2>&1", timeout=10
)
print(stdout.read().decode() or stderr.read().decode())
stdin, stdout, stderr = client.exec_command(
    f"echo '{pw}' | sudo -S ufw allow 5173/tcp comment 'Freight Broker Frontend' 2>&1", timeout=10
)
print(stdout.read().decode() or stderr.read().decode())

print("\n=== Reload ufw ===")
stdin, stdout, stderr = client.exec_command(f"echo '{pw}' | sudo -S ufw reload 2>&1", timeout=10)
print(stdout.read().decode() or stderr.read().decode())

print("\n=== Status after ===")
stdin, stdout, stderr = client.exec_command("sudo -n ufw status numbered 2>&1", timeout=10)
print(stdout.read().decode() or stderr.read().decode())

client.close()
print("\nDone. Try http://192.168.111.137:5173 and http://192.168.111.137:8000")

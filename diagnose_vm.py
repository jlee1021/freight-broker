import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.111.137", username="john", password="1234")

# Check docker containers
_, stdout, _ = client.exec_command("docker ps 2>&1")
print("=== Docker containers ===")
print(stdout.read().decode())

# Check port 5433
_, stdout, _ = client.exec_command("ss -tlnp | grep 5433 2>&1")
print("=== Port 5433 ===")
print(stdout.read().decode())

# Check port 5432  
_, stdout, _ = client.exec_command("ss -tlnp | grep 5432 2>&1")
print("=== Port 5432 ===")
print(stdout.read().decode())

# Get latest log entries from freight-broker/backend.log
_, stdout, _ = client.exec_command("tail -30 /home/john/freight-broker/backend.log 2>&1")
print("=== Latest backend log ===")
print(stdout.read().decode())

client.close()

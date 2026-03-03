import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.111.137", username="john", password="1234")

_, stdout, _ = client.exec_command(
    "cd /home/john/freight-broker/backend && source .venv/bin/activate && alembic current 2>&1"
)
print("Alembic:", stdout.read().decode().strip())

sql = "SELECT column_name FROM information_schema.columns WHERE table_name='customer_invoices' AND column_name LIKE '%reminder%';"
_, stdout, _ = client.exec_command(
    f'PGPASSWORD=postgres psql -h 127.0.0.1 -p 5433 -U postgres -d freight_broker -c "{sql}"'
)
print("Columns:", stdout.read().decode())

# Force migration if needed
_, stdout, _ = client.exec_command(
    "cd /home/john/freight-broker/backend && source .venv/bin/activate && alembic upgrade head 2>&1"
)
print("Upgrade:", stdout.read().decode())

client.close()

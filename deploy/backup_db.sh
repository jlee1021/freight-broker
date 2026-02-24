#!/bin/bash
# PostgreSQL 덤프 백업 (서버에서 실행)
# cron: 0 2 * * * /home/john/freight-broker/deploy/backup_db.sh

set -e
BACKUP_DIR="${BACKUP_DIR:-/home/john/backups}"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
# Docker DB인 경우: docker exec freight-broker-db-1 pg_dump -U postgres freight_broker
# 로컬 DB인 경우: PGPASSWORD=postgres pg_dump -h localhost -p 5433 -U postgres freight_broker
if command -v docker &>/dev/null && docker ps --format '{{.Names}}' | grep -q freight-broker-db; then
  docker exec freight-broker-db-1 pg_dump -U postgres freight_broker | gzip > "$BACKUP_DIR/freight_broker_$DATE.sql.gz"
else
  PGPASSWORD="${PGPASSWORD:-postgres}" pg_dump -h localhost -p 5433 -U postgres freight_broker | gzip > "$BACKUP_DIR/freight_broker_$DATE.sql.gz"
fi
echo "Backup: $BACKUP_DIR/freight_broker_$DATE.sql.gz"
# 30일 지난 백업 삭제 (선택)
find "$BACKUP_DIR" -name "freight_broker_*.sql.gz" -mtime +30 -delete 2>/dev/null || true

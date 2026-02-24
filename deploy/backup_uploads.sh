#!/bin/bash
# 업로드 디렉터리 백업 (POD 등 첨부파일)
# cron: 0 3 * * * /home/john/freight-broker/deploy/backup_uploads.sh

set -e
PROJECT_DIR="${PROJECT_DIR:-/home/john/freight-broker}"
BACKUP_DIR="${BACKUP_DIR:-/home/john/backups}"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
UPLOADS="$PROJECT_DIR/backend/uploads"
if [ -d "$UPLOADS" ]; then
  tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$PROJECT_DIR/backend" uploads
  echo "Backup: $BACKUP_DIR/uploads_$DATE.tar.gz"
else
  echo "No uploads dir: $UPLOADS"
fi
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +30 -delete 2>/dev/null || true

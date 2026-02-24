# 백업·로그 Cron 설정 (Ubuntu 서버)

서버에서 **매일 자동으로 DB 백업·업로드 백업·로그 정리**가 되도록 cron을 등록합니다.

---

## 1. Cron 등록

Ubuntu 서버에 SSH 접속한 뒤 아래를 **한 번만** 실행하세요.

```bash
# 기존 crontab에 추가 (없으면 새로 생성)
(crontab -l 2>/dev/null; echo ""; echo "# Freight Broker: DB 백업 매일 새벽 2시"; echo "0 2 * * * /home/john/freight-broker/deploy/backup_db.sh >> /home/john/backups/cron.log 2>&1"; echo ""; echo "# Freight Broker: 업로드 백업 매일 새벽 3시"; echo "0 3 * * * /home/john/freight-broker/deploy/backup_uploads.sh >> /home/john/backups/cron.log 2>&1"; echo ""; echo "# Freight Broker: 로그 정리 (5MB 넘으면 비움) 매일 4시"; echo "0 4 * * * /home/john/freight-broker/deploy/rotate_logs.sh >> /home/john/backups/cron.log 2>&1") | crontab -
```

**또는** 수동으로 편집하려면:

```bash
crontab -e
```

에디터가 열리면 **맨 아래**에 다음 세 줄을 추가하고 저장합니다.

```
# Freight Broker: DB 백업 매일 새벽 2시
0 2 * * * /home/john/freight-broker/deploy/backup_db.sh >> /home/john/backups/cron.log 2>&1

# Freight Broker: 업로드 백업 매일 새벽 3시
0 3 * * * /home/john/freight-broker/deploy/backup_uploads.sh >> /home/john/backups/cron.log 2>&1

# Freight Broker: 로그 정리 (5MB 넘으면 비움) 매일 4시
0 4 * * * /home/john/freight-broker/deploy/rotate_logs.sh >> /home/john/backups/cron.log 2>&1
```

---

## 2. 확인

```bash
# 등록된 cron 보기
crontab -l

# 백업 디렉터리 생성 (스크립트가 자동으로 만들지만 미리 해두려면)
mkdir -p /home/john/backups
```

다음날 새벽 이후에 `/home/john/backups` 에 `freight_broker_*.sql.gz`, `uploads_*.tar.gz` 파일이 생겼는지 확인하면 됩니다.

---

## 3. 요약

| cron 시간 | 내용 |
|-----------|------|
| 매일 02:00 | DB 덤프 → `~/backups/freight_broker_날짜.sql.gz` (30일 지난 파일 자동 삭제) |
| 매일 03:00 | 업로드 폴더 압축 → `~/backups/uploads_날짜.tar.gz` (30일 지난 파일 자동 삭제) |
| 매일 04:00 | `rotate_logs.sh` 실행 → `backend.log`, `frontend.log` 가 5MB 넘으면 비움 |

`cron.log` 에 위 스크립트들의 출력이 쌓이므로, 가끔 `tail ~/backups/cron.log` 로 확인해 보면 됩니다.

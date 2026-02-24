#!/bin/bash
# backend.log, frontend.log 가 5MB 넘으면 비움 (디스크 방지)
# cron: 0 4 * * * /home/john/freight-broker/deploy/rotate_logs.sh

MAX=5242880
for f in /home/john/backend.log /home/john/frontend.log; do
  [ -f "$f" ] && [ "$(stat -c%s "$f" 2>/dev/null)" -gt "$MAX" ] && echo "" > "$f" && echo "Rotated: $f"
done

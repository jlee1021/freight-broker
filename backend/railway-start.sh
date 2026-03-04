#!/bin/sh
# DATABASE_URL이 없거나 localhost면 안내 후 종료
if [ -z "$DATABASE_URL" ] || echo "$DATABASE_URL" | grep -qE 'localhost|127\.0\.0\.1'; then
  echo "=============================================="
  echo "ERROR: DATABASE_URL is missing or points to localhost."
  echo ""
  echo "In Railway: freight-broker service -> Variables"
  echo "  Add variable:  DATABASE_URL  =  \${{Postgres.DATABASE_URL}}"
  echo "  (Replace 'Postgres' with your DB service name if different)"
  echo "Then: Redeploy"
  echo "=============================================="
  exit 1
fi
exec sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"

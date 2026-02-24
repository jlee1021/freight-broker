#!/bin/bash
# VM 서버에서 백엔드/프론트 재시작.
set -e
ROOT="/home/john/freight-broker"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/freight_broker"

echo "Stopping backend and frontend..."
pkill -9 -f "uvicorn app.main" 2>/dev/null || true
kill -9 $(lsof -ti:5173 -ti:5174 -ti:5175 2>/dev/null) 2>/dev/null || true
pkill -9 -f vite 2>/dev/null || true
pkill -9 -f "npm run dev" 2>/dev/null || true
sleep 3

echo "Starting backend..."
cd "$ROOT/backend"
source .venv/bin/activate 2>/dev/null || true
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 >> /home/john/backend.log 2>&1 &
sleep 2

echo "Starting frontend..."
cd "$ROOT/frontend"
nohup npm run dev >> /home/john/frontend.log 2>&1 &

echo "Done. Backend: http://192.168.111.137:8000  Frontend: http://192.168.111.137:5173"
echo "Logs: tail -f ~/backend.log   tail -f ~/frontend.log"

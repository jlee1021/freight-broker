# Ubuntu 서버에서 실행하기

## 현재 배포 상태 (192.168.111.137)

- **DB**: Docker PostgreSQL 16, 호스트 포트 **5433** (기존 5432와 충돌 방지)
- **Backend**: `uvicorn` → http://192.168.111.137:8000 (API 문서: /docs)
- **Frontend**: Vite dev → http://192.168.111.137:5173
- 로그: `~/backend.log`, `~/frontend.log`

## 사전 요구

- Ubuntu Server (예: 22.04)
- Docker 및 Docker Compose 설치, 또는 Python 3.10+ 및 Node 18+

## 방법 A: Docker Compose로 한 번에 실행

1. 프로젝트를 서버에 둔 뒤:

```bash
cd /home/john/freight-broker   # 실제 경로로 변경
docker compose up -d db
# DB 준비 대기 후
docker compose up -d backend frontend
```

2. 접속

- 프론트: http://서버IP:5173 (또는 frontend 포트)
- API: http://서버IP:8000
- API 문서: http://서버IP:8000/docs

## 방법 B: DB만 Docker, 앱은 로컬 실행

1. DB 기동

```bash
docker compose up -d db
```

2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/freight_broker
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

3. Frontend (다른 터미널)

```bash
cd frontend
npm install
npm run dev
```

## 헬스 체크

- Backend: `curl http://localhost:8000/health` → `{"status":"ok"}`

## 문제 발생 시

- `docs/incident-response.md` (추가 예정) 참고

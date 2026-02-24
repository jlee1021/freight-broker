# Freight Broker

밴쿠버 Freight Broker 사업용 주문/배차 관리 솔루션.

## 스택

- **Frontend**: React (Vite) + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + Alembic
- **DB**: PostgreSQL

## 로컬 개발 (Ubuntu / WSL / Windows)

### 1. PostgreSQL 실행

```bash
# Docker로 DB만 실행
docker run -d --name pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=freight_broker -p 5432:5432 postgres:16-alpine
```

또는 프로젝트 루트에서:

```bash
docker compose up -d db
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # 필요 시 수정
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

브라우저: http://localhost:5173  
API 문서: http://localhost:8000/docs

### 4. 전체 Docker로 실행

```bash
docker compose up -d
```

- 프론트: http://localhost:5173 (또는 nginx 80 포트로 빌드 시)
- 백엔드: http://localhost:8000

## Ubuntu 서버에서 실행

`docs/` 내 운영 가이드 및 장애 대처 문서를 참고하세요.

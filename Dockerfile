# Railway 데모용 올인원 이미지 (루트 Dockerfile = Railway 자동 인식)
# 프론트 빌드 + 백엔드가 함께 서빙. 로컬에서 docker build -t fb . && docker run -p 8000:8000 fb 로 테스트 가능

# 1단계: 프론트 빌드 (빌드에 vite/tsc 필요하므로 devDependencies 포함)
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2단계: 백엔드 + 정적 파일
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# 데모용: weasyprint 제외(설치 느림/실패 방지). PDF는 503으로 처리됨
COPY backend/requirements-railway.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend /fe/dist ./static

EXPOSE 8000
# Railway는 PORT 환경 변수로 포트 지정. 없으면 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

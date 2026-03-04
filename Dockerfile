# Railway: 루트에 Dockerfile 있으면 자동으로 Docker 빌드 사용 (프론트 빌드 + 백엔드 한 컨테이너)

FROM node:20-alpine AS frontend
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY backend/requirements-railway.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend /fe/dist ./static
RUN chmod +x /app/railway-start.sh

EXPOSE 8000
CMD ["/app/railway-start.sh"]

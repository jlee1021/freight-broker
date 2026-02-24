# FreightBroker Pro — 설치 & 배포 가이드

> 대상: IT 담당자, 시스템 관리자

---

## 목차

1. [시스템 요구사항](#1-시스템-요구사항)
2. [사전 준비](#2-사전-준비)
3. [설치 절차](#3-설치-절차)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [서비스 시작](#5-서비스-시작)
6. [업데이트 배포](#6-업데이트-배포)
7. [방화벽 설정](#7-방화벽-설정)
8. [SSL/TLS 설정 (선택)](#8-ssltls-설정-선택)
9. [서비스 자동 시작 등록](#9-서비스-자동-시작-등록)

---

## 1. 시스템 요구사항

### 권장 서버 사양

| 항목 | 최소 | 권장 |
|------|------|------|
| OS | Ubuntu 20.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2 Core | 4 Core |
| RAM | 2 GB | 8 GB |
| 저장공간 | 20 GB | 100 GB (첨부파일 포함) |
| 네트워크 | 내부망 | 내부망 (+ VPN 권장) |

### 필수 소프트웨어

| 소프트웨어 | 버전 | 설치 여부 확인 |
|-----------|------|--------------|
| Python | 3.11 이상 | `python3 --version` |
| Node.js | 18 이상 | `node --version` |
| npm | 9 이상 | `npm --version` |
| Docker | 24 이상 | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |
| Git | 최신 | `git --version` |

---

## 2. 사전 준비

### Ubuntu 서버 패키지 업데이트 및 필수 도구 설치

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-venv python3-pip nodejs npm git curl
```

### Docker 설치

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 이후 재로그인 필요
```

### WeasyPrint 설치 (PDF 생성용)

```bash
sudo apt install -y python3-weasyprint libpango-1.0-0 libharfbuzz0b \
  libpangoft2-1.0-0 libffi-dev libjpeg-dev libopenjp2-7-dev
```

> WeasyPrint가 설치되지 않아도 시스템은 동작합니다. 단, PDF 다운로드 기능이 비활성화됩니다. HTML 미리보기에서 Ctrl+P로 PDF 저장 가능합니다.

---

## 3. 설치 절차

### Step 1 — 소스 코드 다운로드

```bash
# 프로젝트 디렉토리로 이동
cd /home/$USER

# Git 클론 (저장소가 있는 경우)
git clone https://github.com/your-org/freight-broker.git

# 또는 파일 직접 복사 (배포 패키지 사용 시)
# scp -r freight-broker/ john@서버주소:/home/john/
```

### Step 2 — Python 가상환경 구성 및 패키지 설치

```bash
cd /home/$USER/freight-broker/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3 — 프론트엔드 패키지 설치

```bash
cd /home/$USER/freight-broker/frontend
npm install
```

### Step 4 — 데이터베이스 시작 (Docker)

```bash
cd /home/$USER/freight-broker
docker compose up -d db

# 컨테이너 상태 확인 (healthy 상태가 될 때까지 대기)
docker compose ps
```

### Step 5 — DB 마이그레이션

```bash
cd /home/$USER/freight-broker/backend
source .venv/bin/activate
alembic upgrade head
```

성공 시 출력:

```
INFO  [alembic.runtime.migration] Running upgrade  -> xxxx, initial schema
```

---

## 4. 환경 변수 설정

### 백엔드 .env 파일 생성

```bash
cp /home/$USER/freight-broker/.env.example \
   /home/$USER/freight-broker/backend/.env

nano /home/$USER/freight-broker/backend/.env
```

### 환경 변수 항목

```env
# ===== 데이터베이스 =====
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/freight_broker

# ===== 보안 (반드시 변경!) =====
SECRET_KEY=여기에_64자_이상의_무작위_문자열_입력

# ===== JWT =====
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# ===== CORS (프론트엔드 접속 주소) =====
CORS_ORIGINS=http://서버IP주소:5173,http://localhost:5173

# ===== 파일 업로드 경로 =====
UPLOAD_DIR=/home/$USER/freight-broker/uploads

# ===== 이메일 (선택) =====
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
FROM_EMAIL=
```

### SECRET_KEY 생성 방법

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

출력된 문자열을 `SECRET_KEY`에 입력합니다.

### 업로드 디렉토리 생성

```bash
mkdir -p /home/$USER/freight-broker/uploads/load_attachments
chmod 755 /home/$USER/freight-broker/uploads
```

---

## 5. 서비스 시작

### 방법 A — 자동 스크립트 사용 (권장)

```bash
cd /home/$USER/freight-broker
chmod +x restart_services.sh
./restart_services.sh
```

### 방법 B — 수동 시작

**백엔드 시작:**

```bash
cd /home/$USER/freight-broker/backend
source .venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 \
  > /home/$USER/backend.log 2>&1 &
echo "Backend PID: $!"
```

**프론트엔드 시작:**

```bash
cd /home/$USER/freight-broker/frontend
nohup npm run dev > /home/$USER/frontend.log 2>&1 &
echo "Frontend PID: $!"
```

### 서비스 동작 확인

```bash
# API 헬스체크
curl http://localhost:8000/api/v1/health
# 기대 응답: {"status":"ok"}

# 또는 브라우저에서
# http://서버IP:8000/docs  → Swagger UI 표시
# http://서버IP:5173       → 로그인 화면 표시
```

---

## 6. 업데이트 배포

### 로컬 PC(Windows)에서 자동 배포

코드 수정 후 아래 명령어를 실행하면 서버에 자동 업로드 후 서비스가 재시작됩니다.

```powershell
cd C:\Users\jonghun.lee\freight-broker
python deploy_to_ubuntu.py
```

### 서버에서 직접 업데이트 (Git 사용 시)

```bash
cd /home/$USER/freight-broker
git pull origin main

# 백엔드 의존성 업데이트 (requirements.txt 변경 시)
source backend/.venv/bin/activate
pip install -r backend/requirements.txt

# DB 마이그레이션 (스키마 변경 시)
cd backend && alembic upgrade head && cd ..

# 프론트엔드 빌드 (package.json 변경 시)
cd frontend && npm install && cd ..

# 서비스 재시작
./restart_services.sh
```

---

## 7. 방화벽 설정

### UFW (Ubuntu Firewall) 설정

```bash
# UFW 활성화
sudo ufw enable

# SSH 허용
sudo ufw allow 22/tcp

# 프론트엔드 (내부망만 허용 권장)
sudo ufw allow from 192.168.0.0/16 to any port 5173

# 백엔드 API (내부망만 허용 권장)
sudo ufw allow from 192.168.0.0/16 to any port 8000

# 상태 확인
sudo ufw status
```

> **보안 권장**: API 포트(8000)는 외부에 직접 노출하지 마십시오. 프론트엔드(5173)만 필요한 경우 외부 접근 허용, API는 내부망 전용으로 유지합니다.

---

## 8. SSL/TLS 설정 (선택)

외부 인터넷에서 접속하는 경우 HTTPS 설정을 권장합니다.

### Nginx 리버스 프록시 설정

```bash
sudo apt install nginx -y
```

Nginx 설정 파일 생성:

```bash
sudo nano /etc/nginx/sites-available/freight-broker
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 프론트엔드
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 백엔드 API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/freight-broker \
           /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Let's Encrypt SSL 인증서 (도메인 보유 시)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 9. 서비스 자동 시작 등록

서버 재부팅 후 서비스가 자동으로 시작되도록 systemd 서비스를 등록합니다.

### 백엔드 서비스 등록

```bash
sudo tee /etc/systemd/system/freight-backend.service << EOF
[Unit]
Description=FreightBroker Pro Backend
After=network.target docker.service

[Service]
User=$USER
WorkingDirectory=/home/$USER/freight-broker/backend
ExecStart=/home/$USER/freight-broker/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=5
StandardOutput=append:/home/$USER/backend.log
StandardError=append:/home/$USER/backend.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable freight-backend
sudo systemctl start freight-backend
sudo systemctl status freight-backend
```

### 프론트엔드 서비스 등록

```bash
sudo tee /etc/systemd/system/freight-frontend.service << EOF
[Unit]
Description=FreightBroker Pro Frontend
After=network.target

[Service]
User=$USER
WorkingDirectory=/home/$USER/freight-broker/frontend
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=5
StandardOutput=append:/home/$USER/frontend.log
StandardError=append:/home/$USER/frontend.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable freight-frontend
sudo systemctl start freight-frontend
sudo systemctl status freight-frontend
```

### 서비스 관리 명령어

```bash
# 상태 확인
sudo systemctl status freight-backend
sudo systemctl status freight-frontend

# 재시작
sudo systemctl restart freight-backend
sudo systemctl restart freight-frontend

# 로그 확인
sudo journalctl -u freight-backend -f
sudo journalctl -u freight-frontend -f
```

---

## 설치 확인 체크리스트

```
[ ] Docker 및 DB 컨테이너 정상 실행 (docker compose ps)
[ ] Alembic 마이그레이션 완료
[ ] 백엔드 서비스 응답 확인 (curl http://localhost:8000/api/v1/health)
[ ] 프론트엔드 브라우저 접속 확인
[ ] 로그인 (admin@local / admin123) 성공
[ ] 대시보드 정상 로딩
[ ] .env의 SECRET_KEY 변경 완료
[ ] .env의 CORS_ORIGINS에 실제 접속 주소 등록
[ ] 업로드 디렉토리 쓰기 권한 확인
[ ] (선택) SMTP 이메일 테스트 성공
[ ] (선택) systemd 서비스 등록 완료
```

---

*설치 중 문제 발생 시 `~/backend.log`와 `~/frontend.log`를 확인하거나 시스템 공급사에 문의하십시오.*

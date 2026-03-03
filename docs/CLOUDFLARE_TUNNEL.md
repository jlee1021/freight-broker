# Cloudflare Tunnel — 외부 데모 URL 설정 가이드

무료로 고정 공개 URL을 만들어 고객에게 시연할 수 있습니다.
Cloudflare 계정만 있으면 되며, 포트 개방이나 공인 IP 설정이 필요 없습니다.

---

## 1단계: Cloudflare 계정 생성

1. https://dash.cloudflare.com 접속 후 **Free 플랜** 가입
2. 로그인 후 좌측 사이드바 → **Zero Trust** 클릭
3. Zero Trust 대시보드에서 **Networks → Tunnels** 이동

---

## 2단계: VM 서버에 cloudflared 설치

Ubuntu VM(`192.168.111.137`)에 SSH 접속 후 실행:

```bash
# Cloudflared 설치
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 설치 확인
cloudflared --version
```

---

## 3단계: Tunnel 생성 및 인증

```bash
# 브라우저 인증 (출력된 URL을 PC 브라우저에서 열어 승인)
cloudflared tunnel login

# Tunnel 생성 (이름은 원하는 것으로)
cloudflared tunnel create freight-broker-demo

# 생성된 Tunnel ID 확인 (UUID 형태, 메모 필요)
cloudflared tunnel list
```

---

## 4단계: Tunnel 설정 파일 작성

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

아래 내용 붙여넣기 (TUNNEL_ID를 실제 값으로 교체):

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/john/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  # 프론트엔드 (React)
  - hostname: demo.yourdomain.com
    service: http://localhost:5173

  # 백엔드 API (선택 — API를 직접 노출할 경우)
  - hostname: api.yourdomain.com
    service: http://localhost:8000

  # 기본 catch-all (필수)
  - service: http_status:404
```

> **도메인 없는 경우**: `*.trycloudflare.com` 임시 무료 URL 사용 가능 (아래 참고)

---

## 5단계: DNS 등록

Cloudflare 대시보드 → Tunnels → 생성한 터널 → **Configure** → **Public Hostnames**:

| Subdomain | Domain | Service |
|-----------|--------|---------|
| demo | yourdomain.com | `http://localhost:5173` |

> 도메인이 없다면 **5단계 건너뛰고** 아래 임시 URL 방식 사용:

```bash
# 도메인 없이 임시 공개 URL 생성 (데모/테스트용)
cloudflared tunnel --url http://localhost:5173
# → 예: https://random-name.trycloudflare.com
```

---

## 6단계: Tunnel 실행 (백그라운드)

```bash
# 수동 실행 (테스트)
cloudflared tunnel run freight-broker-demo

# 서비스로 등록 (서버 재시작 시 자동 시작)
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

---

## 7단계: CORS 설정 업데이트

공개 URL로 접근 시 CORS 오류가 없도록 `.env` 업데이트:

```bash
nano /home/john/freight-broker/backend/.env
```

```env
CORS_ORIGINS=http://192.168.111.137:5173,http://localhost:5173,https://demo.yourdomain.com
```

```bash
# 백엔드 재시작
cd /home/john/freight-broker && ./restart_services.sh
```

---

## 완료 후 확인

| 항목 | 확인 방법 |
|------|-----------|
| 프론트엔드 접근 | `https://demo.yourdomain.com` 브라우저 열기 |
| API 상태 | `https://api.yourdomain.com/health` |
| 로그인 | admin@local / admin123 (데모 후 변경 권장) |

---

## 주의사항

- **Free 플랜**: 월 50GB 트래픽, 동시 접속 수 제한 없음 (데모용으로 충분)
- **trycloudflare.com**: 임시 URL은 프로세스 종료 시 삭제됨 (고정 URL 필요 시 도메인 구매)
- **보안**: 공개 URL이 만들어지면 `admin123` 비밀번호를 반드시 변경하세요

---

## 빠른 요약 (이미 계정 있는 경우)

```bash
# 1줄 명령으로 즉시 임시 공개 URL 생성
cloudflared tunnel --url http://localhost:5173
```

출력된 `https://xxxx.trycloudflare.com` URL을 고객에게 공유하면 됩니다.

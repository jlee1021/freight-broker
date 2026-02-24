# HTTPS 설정 가이드 (Ubuntu 서버)

## 1. Nginx 설치 및 기본 리버스 프록시 (HTTP)

```bash
sudo apt update && sudo apt install -y nginx
sudo cp /home/john/freight-broker/deploy/nginx-freight-broker.conf /etc/nginx/sites-available/freight-broker
sudo ln -sf /etc/nginx/sites-available/freight-broker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # 기본 사이트 비활성화(선택)
sudo nginx -t && sudo systemctl reload nginx
```

이후 `http://192.168.111.137` 로 접속 시 Nginx가 80 포트에서 받아 5173(프론트)/8000(API)으로 전달합니다.

## 2. HTTPS (Let's Encrypt) – 도메인이 있을 때

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

certbot이 자동으로 443 리스너와 SSL 인증서를 설정합니다. 갱신은 `sudo certbot renew` (cron에 등록 권장).

## 3. 자체 서명 인증서 (도메인 없이 테스트용)

```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/selfsigned.key \
  -out /etc/nginx/ssl/selfsigned.crt \
  -subj "/CN=192.168.111.137"
```

그 다음 Nginx에 `listen 443 ssl` 서버 블록을 추가하고 `ssl_certificate` / `ssl_certificate_key`를 위 경로로 지정합니다.

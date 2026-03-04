# Railway 무료 데모 배포 가이드

데모/테스트용으로 **한 개 URL**에서 프론트+백엔드+DB까지 올리는 방법입니다.  
Railway 무료 플랜(월 $1 크레딧)으로 짧게 쓸 수 있습니다.

---

## 1. 준비 사항

- GitHub에 `freight-broker` 저장소가 올라가 있어야 합니다.
- 이 가이드 반영을 위해 최소한 다음이 포함되어 있어야 합니다:
  - **루트**에 `Dockerfile.railway` (프론트 빌드 + 백엔드 올인원)
  - **backend**에 `static/` 폴더는 비우거나 없어도 됨 (Docker에서 빌드된 파일을 넣음)
  - **backend/app/main.py** 에 정적 파일 서빙 코드 추가됨
  - **frontend/src/api.ts** 에서 배포 시 같은 도메인 기준으로 API 호출하도록 수정됨

---

## 2. Railway 가입 및 GitHub 연동

1. **https://railway.app** 접속 후 **Login** → **Login with GitHub** 선택.
2. GitHub 권한 허용 후 Railway 대시보드로 이동합니다.
3. (선택) 상단 **Account** → **Settings** 에서 무료 플랜인지 확인합니다.  
   - 신규 가입 시 **$5 크레딧(30일)** 주고, 이후 **Free 플랜**이면 **월 $1** 크레딧입니다.

---

## 3. 새 프로젝트 만들기

1. Railway 대시보드에서 **New Project** 클릭.
2. **Deploy from GitHub repo** 선택.
3. **Configure GitHub App** 이 나오면 **설치** 후, 저장소 목록에서 **freight-broker** 선택.
4. **한 번에** “Add variables later” 등만 보이면 **Deploy** 는 아직 누르지 말고, 아래 4단계까지 진행합니다.

(또는 **Empty Project** 로 만든 뒤, 아래에서 **Postgres** 와 **GitHub Repo** 서비스를 따로 추가해도 됩니다.)

---

## 4. PostgreSQL 추가

1. 프로젝트 안에서 **+ New** 버튼 클릭.
2. **Database** → **PostgreSQL** 선택.
3. 생성되면 목록에 **Postgres** 서비스가 생깁니다. 클릭해서 들어갑니다.
4. **Variables** 탭에 `DATABASE_URL` 등이 보이면 정상입니다.  
   (다음 단계에서 웹 서비스가 이 DB를 쓰도록 연결합니다.)

---

## 5. 웹 서비스(백엔드+프론트) 추가

1. 다시 프로젝트 루트로 나와서 **+ New** → **GitHub Repo** 선택.
2. **freight-broker** 저장소 선택 후 추가합니다.
3. 추가된 **서비스(이름이 저장소명)** 를 클릭합니다.
4. **Settings** 탭으로 이동합니다.

### 5.1 빌드/시작 설정

- **Root Directory**: 비움 (저장소 루트).
- 저장소 **루트에 `Dockerfile`** 이 있으면 Railway가 자동으로 Docker 빌드를 사용합니다 (Railpack 대신).  
  별도로 Builder를 고르거나 Dockerfile Path를 넣을 필요 없습니다.
- 만약 **Railpack**으로 빌드된다면: 서비스 **Variables**에 `RAILWAY_DOCKERFILE_PATH=Dockerfile` 추가 후 재배포.
- **Start Command**: 비움 (Dockerfile의 `CMD` 사용).
- **Watch Paths**: 비움.

### 5.2 Postgres 연결(환경 변수)

1. **Variables** 탭으로 이동합니다.
2. **+ New Variable** 또는 **Add variable** → **Add a variable reference** 선택.
3. Postgres 서비스의 **DATABASE_URL** 을 참조하도록 추가합니다.  
   - 변수 이름: `DATABASE_URL`  
   - 값: Postgres 서비스의 **Variables** 에 있는 `DATABASE_URL` 를 “참조”로 선택 (보통 `${{Postgres.DATABASE_URL}}` 형태).

직접 붙여넣어도 됩니다. Postgres 서비스 **Variables** 탭에서 `DATABASE_URL` 값을 복사해, 웹 서비스 Variables에 아래처럼 넣습니다.

| Name         | Value (예시, 실제는 Railway가 준 값) |
|-------------|--------------------------------------|
| DATABASE_URL | postgresql://postgres:비밀번호@호스트:5432/railway |

### 5.3 그 밖의 환경 변수(선택이지만 권장)

| Name        | Value        | 비고                    |
|------------|--------------|-------------------------|
| SECRET_KEY | 긴 랜덤 문자열(32자 이상) | JWT 서명용, 데모도 설정 권장 |
| CORS_ORIGINS | *           | 같은 도메인만 쓰면 * 도 무방 |

- **SECRET_KEY**: 터미널에서 `python -c "import secrets; print(secrets.token_urlsafe(32))"` 로 생성 후 붙여넣으면 됩니다.

저장 후 **Redeploy** 하거나, 다음 배포 시 자동으로 반영됩니다.

---

## 6. 배포 및 URL 확인

1. **Deployments** 탭에서 빌드/배포가 진행됩니다.  
   - 첫 배포는 프론트 빌드 때문에 5~10분 걸릴 수 있습니다.
2. **Settings** 탭 아래쪽 **Networking** → **Generate Domain** 클릭하면 `https://xxx.up.railway.app` 형태의 URL이 생깁니다.
3. 이 URL로 접속하면:
   - **/** → 로그인 화면(프론트)
   - **/docs** → Swagger API 문서
   - **/health** → `{"status":"ok"}`

---

## 7. 로그인

- 기본 시드 계정: **admin@local** / **admin123**  
- 데모 끝나면 비밀번호 변경하거나, Railway에서 서비스/DB 삭제하면 됩니다.

---

## 8. 무료 한도와 비용

- **Free 플랜**: 월 **$1** 크레딧.  
  - Postgres 1개 + 웹 서비스 1개(소규모)면 데모용으로 며칠~1주 정도 쓸 수 있는 수준입니다.
- **크레딧 소진** 후에는 서비스가 중단될 수 있으므로, “잠깐 데모만” 용도로 쓰고 **서비스/프로젝트 삭제**로 정리하는 것을 권장합니다.
- 사용량은 Railway 대시보드 **Usage** 에서 확인할 수 있습니다.

---

## 9. 트러블슈팅

| 현상 | 확인 사항 |
|------|-----------|
| 빌드 실패 | **Dockerfile Path** 가 `Dockerfile.railway` 인지, 저장소에 해당 파일이 있는지 확인. |
| 502 / 연결 안 됨 | **Variables** 에 `DATABASE_URL` 이 제대로 들어갔는지, Postgres 서비스가 Running 인지 확인. |
| 로그인 후 401 | **SECRET_KEY** 가 설정되어 있는지 확인. |
| 화면만 나오고 API 실패 | 브라우저 개발자 도구 Network 탭에서 요청 URL이 `https://같은도메인/api/v1/...` 인지 확인. |

---

## 10. 정리(데모 끝났을 때)

1. Railway 프로젝트 페이지에서 해당 **서비스** 선택 → **Settings** → 맨 아래 **Remove Service**.
2. **Postgres** 서비스도 **Remove Service** 하면 DB 포함 모두 삭제됩니다.
3. (선택) **Account** → **Billing** 에서 사용량 확인 후, 더 이상 쓰지 않으면 팀/프로젝트 정리.

이렇게 하면 Railway에 무료로 잠깐 올렸다가, 데모만 보여주고 정리할 수 있습니다.

# Railway 배포 가이드 (freight-broker)

GitHub 저장소를 Railway에 올려 한 개 URL로 데모 접속하는 방법입니다.

---

## 1. 사전 준비

- GitHub에 `freight-broker` 저장소가 push 되어 있어야 합니다.
- Railway 계정: https://railway.app → **Login with GitHub**

---

## 2. 프로젝트 생성 및 Postgres 추가

1. Railway 대시보드에서 **New Project** 클릭.
2. **Deploy from GitHub repo** 선택.
3. 저장소 목록에서 **freight-broker** 선택 후 Deploy(또는 추가).
4. 같은 프로젝트 안에서 **+ New** 클릭 → **Database** → **PostgreSQL** 선택.
5. Postgres 서비스가 생성되면 목록에 **Postgres** (또는 지정한 이름)로 보입니다.

---

## 3. 앱 서비스에 DATABASE_URL 연결 (필수)

앱이 DB에 붙으려면 **freight-broker 서비스**에 Postgres의 연결 정보를 넣어야 합니다.

1. 왼쪽에서 **freight-broker** (GitHub에서 추가한 서비스) 클릭.
2. 상단 탭에서 **Variables** 선택.
3. **+ New Variable** 또는 **Add Variable** 클릭.
4. **Variable reference** / **Reference** 를 선택합니다.  
   (직접 값 넣는 게 아니라, “다른 서비스 변수 참조”로 추가하는 항목입니다.)
5. **서비스**: 방금 만든 **Postgres** 선택.
6. **변수**: **DATABASE_URL** 선택.
7. freight-broker에서 쓰는 **변수 이름**을 **DATABASE_URL** 로 맞춥니다.  
   (참조만 추가하고 이름을 비우면 안 됩니다. 이름을 `DATABASE_URL`로 지정.)
8. 저장.

참조 문법으로 넣는 경우 예시는 아래와 같습니다.  
(UI에서 “Reference”로 고르면 서비스 이름이 자동으로 들어갑니다.)

```text
DATABASE_URL = ${{Postgres.DATABASE_URL}}
```

Postgres 서비스 이름이 `Postgres`가 아니면, 그 이름으로 바꿉니다 (예: `postgres` → `${{postgres.DATABASE_URL}}`).

- 이 단계를 하지 않으면 앱이 `localhost:5432`로 접속을 시도해서 **Crashed** 됩니다.
- 저장 후 자동으로 재배포될 수 있습니다. 안 되면 **Deployments** 탭에서 **Redeploy** 한 번 실행.

---

## 4. 빌드 설정 확인

- 저장소 **루트**에 `Dockerfile`이 있으면 Railway는 자동으로 **Docker** 로 빌드합니다. (Railpack 아님.)
- **Root Directory**는 비워 둡니다 (저장소 루트가 기준).
- **Settings** → Build 쪽에서 Dockerfile Path를 따로 지정할 필요 없습니다. 루트 `Dockerfile` 사용.

---

## 5. 공개 URL 만들기

1. **freight-broker** 서비스 선택.
2. **Settings** 탭 → **Networking** 섹션.
3. **Generate domain** / **Public network** 등으로 공개 URL 생성.
4. `https://xxxx.up.railway.app` 형태의 주소가 나옵니다.

이 URL로 접속하면 로그인 화면이 나와야 합니다.

---

## 6. 로그인

- 기본 계정: **admin@local** / **admin123**
- 데모 후에는 Railway에서 서비스/DB 삭제하거나 비밀번호 변경 권장.

---

## 7. (선택) SECRET_KEY

- **Variables**에 `SECRET_KEY`를 넣지 않으면 기본값으로 동작합니다. 데모만 할 때는 생략 가능.
- 운영처럼 쓰려면 32자 이상 랜덤 문자열을 넣어 두는 것이 좋습니다.

---

## 8. 문제 해결

| 현상 | 확인 사항 |
|------|-----------|
| **Crashed** + 로그에 `localhost:5432 connection refused` 또는 `DATABASE_URL is missing or points to localhost` | freight-broker 서비스 **Variables**에 **DATABASE_URL**을 **반드시** 추가. **직접 값이 아니라** Postgres 서비스 변수 **참조(Reference)** 로 추가: 변수 이름 `DATABASE_URL`, 값 `${{Postgres.DATABASE_URL}}` (Postgres 서비스 이름에 맞게). |
| **Build failed** / Railpack 사용됨 | 루트에 `Dockerfile`(대소문자 포함)이 있고, Root Directory가 비어 있는지 확인. |
| 로그인 후 401 | **SECRET_KEY** 설정 여부 확인. |

---

## 9. 요약 체크리스트

- [ ] Railway 프로젝트 생성 후 **Postgres** 추가
- [ ] **freight-broker** 서비스 **Variables**에 **DATABASE_URL** = Postgres의 DATABASE_URL **참조** 추가
- [ ] **Generate domain**으로 공개 URL 생성
- [ ] 해당 URL로 접속 후 admin@local / admin123 로 로그인

이 순서대로 하면 Railway에서 정상 배포·접속할 수 있습니다.

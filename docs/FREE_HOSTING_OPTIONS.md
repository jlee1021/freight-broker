# GitHub 솔루션 외부 접근용 무료 호스팅 옵션

React(Frontend) + FastAPI(Backend) + PostgreSQL 스택을 **무료**로 외부에 공개하는 방법 정리입니다.

---

## 1. 요약 비교

| 플랫폼 | 프론트 | 백엔드 | DB | 무료 한도 | GitHub 연동 | 비고 |
|--------|--------|--------|-----|-----------|-------------|------|
| **Railway** | ✅ | ✅ | ✅ PostgreSQL | 월 $1 크레딧 (제한적) | ✅ | 올인원, 간단 |
| **Render** | ✅ | ✅ | ✅ (30일 후 만료) | 제한적 무료 | ✅ | DB 무료는 30일 |
| **Vercel + Railway** | Vercel | Railway | Railway Postgres | 넉넉함 | ✅ | 조합 추천 |
| **Fly.io** | ✅ | ✅ | ✅ Postgres 3GB | $5/월 크레딧(소진 시 $0) | ✅ | 카드 필요 |
| **Vercel만** | ✅ | ✅ (Serverless) | ❌ 외부 DB 필요 | 넉넉함 | ✅ | 백엔드도 Vercel 가능, DB만 따로 |

---

## 2. 추천 조합 (무료로 오래 쓰기)

### A. **Vercel(프론트) + Railway(백엔드+DB)** ⭐ 추천

- **Vercel**: React 빌드 결과만 배포 → 무료 한도 넉넉함 (개인/팀)
- **Railway**: FastAPI 서버 1개 + PostgreSQL 1개 → 무료 플랜 **월 $1 크레딧** (소규모 트래픽이면 버틸 수 있음)
- GitHub 연결하면 push 시 자동 배포 가능

**설정 요약**

1. **Railway** (https://railway.app)
   - GitHub 연동 → `freight-broker` 선택
   - 프로젝트에 **Service 2개** 추가: `backend`(또는 Dockerfile 기준), `PostgreSQL`
   - Backend의 `DATABASE_URL`을 Postgres 서비스 연결 변수로 설정
   - 배포 후 생성되는 URL(예: `https://xxx.up.railway.app`)을 메모

2. **Vercel** (https://vercel.com)
   - GitHub 연동 → **프론트만** 배포할 저장소/폴더 지정
   - Root Directory를 `frontend`로 설정 (모노레포인 경우)
   - Build Command: `npm run build`, Output: `dist` (또는 Vercel이 Vite 감지)
   - **Environment Variable**: `VITE_API_URL=https://xxx.up.railway.app` (Railway 백엔드 URL)
   - 프론트에서 API 호출 시 이 변수 사용하도록 이미 되어 있으면 완료

**장점**: 프론트/백 분리되어 스케일 조절 쉬움, Vercel 무료 한도가 넉넉함.  
**단점**: Railway $1/월은 매우 적어서, 사용량이 조금만 많아지면 유료 전환 필요.

---

### B. **Railway 올인원** (한 곳에서 모두)

- 같은 Railway 프로젝트에 **3개 서비스**: Frontend(정적 또는 Node로 서빙), Backend(FastAPI), PostgreSQL
- GitHub에서 저장소 연결 후 각 서비스가 해당 디렉터리/도커 설정으로 배포
- 모노레포면 Railway 문서의 "Deploying a Monorepo" 참고해 `frontend` / `backend` 경로 지정

**장점**: 설정 한 곳에서 끝.  
**단점**: 무료 크레딧 $1/월이라 서비스 3개 돌리면 금방 소진.

---

### C. **Render (백엔드 + DB) + Vercel (프론트)**

- **Render**: Web Service(FastAPI) + PostgreSQL
  - 무료 PostgreSQL은 **90일→30일**로 단축됨(만료 후 새로 만들면 다시 30일)
  - Web Service 무료 티어: 15분 미사용 시 슬립 → 첫 요청 시 느리게 깨어남
- **Vercel**: 프론트만 배포 (A와 동일)

**장점**: DB 30일 제한만 감수하면, 백엔드/DB를 Render에서 무료로 운영 가능.  
**단점**: 슬립 시 첫 로딩 지연, DB 주기적 재생성 필요.

---

### D. **Fly.io (백엔드 + DB + 프론트)**

- **Fly.io**: 앱 여러 개 배포 가능, Postgres 3GB 무료
- 결제 수단 등록 후 **$5/월 크레딧** 제공(소진 시만 과금)
- 256MB VM 소규모로 쓰면 한 달 내내 $0으로 쓸 수 있는 경우 많음

**설정**:  
- Backend용 앱 1개, Postgres 1개, (선택) Frontend용 정적 앱 1개 또는 Backend에서 정적 파일 서빙

**장점**: DB 만료 없음(무료 3GB), 한 플랫폼에서 통일.  
**단점**: 결제 수단 필수, 초기 설정이 Railway보다 다소 복잡.

---

## 3. 플랫폼별 요약

### Railway
- **무료**: 첫 체험 $5(30일), 이후 **Free 플랜 월 $1** 크레딧
- GitHub 연동, Docker/빌드팩 지원, PostgreSQL 추가 가능
- 한도: 프로젝트 1개, 서비스당 메모리 등 제한 있음 → [Pricing](https://docs.railway.com/reference/pricing/plans)

### Render
- **무료**: Web Service(슬립 있음), PostgreSQL **30일** 무료(만료 후 재생성 가능)
- GitHub 자동 배포, 환경 변수 설정 지원

### Vercel
- **무료**: 프론트/Serverless API 넉넉함
- GitHub push 시 자동 배포, 프리뷰 URL
- 백엔드도 Serverless로 올릴 수 있으나, DB는 외부(Railway/Render 등) 필요

### Fly.io
- **무료**: 결제 수단 등록 후 **$5/월 크레딧**, Postgres 3GB
- VM 기반이라 항상 켜진 서버처럼 동작

---

## 4. 우리 프로젝트(freight-broker) 적용 시 체크

1. **CORS**: 백엔드에서 프론트 도메인(예: `https://xxx.vercel.app`) 허용하도록 `CORS_ORIGINS` 설정.
2. **API 베이스 URL**: 프론트 환경 변수(예: `VITE_API_URL`)에 배포된 백엔드 URL 넣기.
3. **DB 마이그레이션**: 배포 후 서버에서 `alembic upgrade head` 실행(Railway/Render/Fly 등은 deploy 명령/스크립트에 포함).
4. **시크릿**: `SECRET_KEY`, DB 비밀번호 등은 플랫폼의 **Environment Variables**에만 넣고 저장소에는 올리지 않기.

---

## 5. 참고 링크

- [Railway – Deploy from GitHub](https://docs.railway.com/guides/deploying-from-github)
- [Railway – Pricing / Free trial](https://docs.railway.com/pricing/free-trial)
- [Render – Deploy for Free](https://docs.render.com/free)
- [Vercel – Deploying with Git](https://vercel.com/docs/deployments/git)
- [Fly.io – Free Postgres](https://fly.io/blog/free-postgres/)
- [Fly.io – Pricing](https://fly.io/docs/about/pricing/)

원하시면 **Vercel + Railway** 또는 **Render** 중 하나를 골라서, 이 저장소 구조(frontend/backend 분리) 기준으로 단계별 배포 절차를 더 쪼개서 정리해 드릴 수 있습니다.

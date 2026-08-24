# BugHunter

버그가 포함된 Python 코드를 고치며 디버깅을 학습하는 45 Mission 웹 플랫폼입니다.

## Docker로 실행

1. Docker Desktop의 WSL integration을 활성화하고 `docker version`이 동작하는지 확인합니다.
2. `.env.example`을 `.env`로 복사한 뒤 `ADMIN_PASSWORD`를 12자 이상의 안전한 값으로 변경합니다.
3. `pnpm docker:up`을 실행합니다.
4. `http://localhost:5173`에서 `.env`의 admin 계정으로 로그인합니다.

`setup` 컨테이너가 Prisma migration과 45개 Mission seed를 한 번 수행한 뒤 API를 시작합니다. seed를 다시 실행하면 admin role, username, password가 현재 `.env`와 동기화됩니다. Admin은 학습 progress와 관계없이 모든 Mission이 열리고, 일반 사용자의 순차 해금 규칙은 유지됩니다.

Web은 Nginx가 정적 bundle을 제공하고 `/api`를 API 컨테이너로 proxy합니다. PostgreSQL과 Redis는 host의 `127.0.0.1`에만 노출되며 Docker socket은 Judge Worker에만 마운트됩니다. `pnpm docker:up`은 socket의 실제 group ID를 Worker에 전달하며, Worker는 PostgreSQL, Redis, Docker 연결을 모두 확인한 뒤에만 채점 큐에 등록됩니다.

상태 확인과 종료는 다음 명령을 사용합니다.

```text
pnpm docker:ps
pnpm docker:logs
pnpm docker:down
```

`docker compose down -v`는 PostgreSQL volume까지 삭제하므로 데이터를 초기화할 때만 사용하세요.

## Local 개발

Docker로 PostgreSQL과 Redis만 실행한 뒤 local dev server를 사용할 수도 있습니다.

```text
docker compose up -d postgres redis
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm --filter @bughunter/api prisma:seed
pnpm dev
```

## 상태와 검증

- `/api/health`: PostgreSQL과 Redis 연결 확인
- `/api/health/ready`: PostgreSQL, Redis, Judge Worker readiness 확인
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`: source 검증
- `pnpm test:judge-docker`: Docker 격리 제한 7개 검증
- `pnpm test:judge-content`: 45개 초기 코드와 reference solution을 실제 Docker Runner로 검증
- `pnpm test:judge-api-content`: admin 계정으로 45개 reference solution을 Web proxy/API/Queue/Worker에 실제 제출

## Vercel + Render 배포

Frontend는 Vercel, API와 PostgreSQL/Redis는 Render Blueprint로 배포할 수 있습니다. 기본
`vercel.app`/`onrender.com` 주소를 사용할 때는 배포 설정이 secure cross-site session cookie를
사용하며, API는 설정한 `WEB_ORIGIN`에서 온 변경 요청만 허용합니다.

현재 Judge Worker는 Docker socket이 필요한 구조이므로 Render에 포함하지 않습니다. Docker를
실행할 수 있는 별도 Worker가 연결되기 전까지 실행과 제출 요청은 즉시 `503`을 반환하며 Queue에
무기한 남지 않습니다.

Dashboard 설정 순서와 배포 후 확인 항목은 [배포 가이드](docs/deployment.md)를 따릅니다.

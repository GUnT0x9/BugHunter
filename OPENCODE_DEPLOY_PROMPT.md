# OpenCode용 Debugrove 배포 프롬프트

아래 코드 블록 전체를 OpenCode에 전달하세요.

```text
현재 BugHunter/Debugrove 모노레포의 작업 변경을 검증하고 GitHub main에 push한 뒤 운영 배포까지 완료해라.

운영 구성:
- GitHub: https://github.com/GUnT0x9/BugHunter.git
- branch: main
- Frontend: 기존 Vercel 프로젝트 `debugrove`
- 대표 주소: https://debugrove.vercel.app
- Backend/PostgreSQL/Redis: `render.yaml`의 Render Blueprint
- Render는 main push 시 자동 배포하며 API 시작 전에 `prisma migrate deploy`를 실행한다.
- Vercel `/api` 요청은 Render API로 프록시된다.

안전 규칙:
- `.env`, `.env.local`, 비밀번호, API key, cookie, token을 출력하거나 commit하지 마라.
- 사용자 소유의 무관한 변경을 수정·삭제·commit하지 마라.
- 새 Vercel 프로젝트를 만들지 말고 기존 `debugrove`만 사용해라.
- `bughunter-web.vercel.app`, `bug-hunter-api.vercel.app` 등 구형 BugHunter 도메인/프로젝트를 만들지 마라.
- 대표 도메인은 `debugrove.vercel.app` 하나로 유지해라.
- 검증 실패를 무시한 채 push 또는 배포하지 마라.

작업 순서:
1. `git status --short`, `git branch -vv`, `git remote -v`로 변경·branch·remote를 확인한다.
2. remote가 위 GitHub 주소이고 branch가 main인지 확인한다.
3. 다음을 순서대로 실행한다.
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm lint`
   - `pnpm build`
   - `pnpm --filter @bughunter/api exec prisma validate --schema prisma/schema.prisma`
   - `git diff --check`
4. 실패하면 원인을 수정하고 전체 검증을 다시 수행한다.
5. 작업 관련 파일만 stage하고 구체적인 메시지로 commit한다. 사용자 파일이나 비밀 파일을 일괄 stage하지 마라.
6. `git -c http.version=HTTP/1.1 push origin main`으로 push한다.
7. Render 자동 배포와 migration이 완료될 때까지 기다린다.
8. Vercel Git 자동 배포가 Ready/Production인지 `vercel ls debugrove`로 확인한다.
9. 최신 Ready deployment를 대표 주소에 연결한다:
   `vercel alias set <latest-deployment-url> debugrove.vercel.app`
10. Vercel이 `bughunter-web.vercel.app`을 자동 생성했다면 즉시 제거한다:
    `vercel alias rm bughunter-web.vercel.app --yes`
11. 다음 운영 상태를 실제 HTTP 요청으로 확인한다.
    - `https://debugrove.vercel.app/` → 200
    - `https://debugrove.vercel.app/api/health` → 200 및 database/redis up
    - 새 인증 API를 비로그인으로 요청 → 401
    - 대표 주소 HTML의 JS/CSS hash가 최신 deployment와 일치
12. `vercel alias ls`에서 BugHunter 이름의 별칭이 없고 대표 주소가 최신 배포를 가리키는지 확인한다.
13. 최종 보고에는 commit hash, push 결과, 테스트 수, migration 상태, 최신 deployment URL, 대표 주소와 health 결과를 포함한다.

참고: 로컬 PostgreSQL이 꺼져 P1001이 발생할 수 있다. 로컬 DB 연결 실패와 Render 운영 migration 결과를 구분해서 보고하며, 운영 migration을 확인하지 않고 성공이라고 추측하지 마라.
```

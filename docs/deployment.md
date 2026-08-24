# Vercel + Render 배포 가이드

이 구성은 Vercel에 React/Vite Web을, Render에 NestJS API, PostgreSQL, Key Value를 배포합니다.
Judge Worker는 Docker host가 준비될 때까지 배포하지 않으며 API가 이를 감지해 채점 요청을
거절합니다.

## 1. Render Blueprint 생성

1. Render Dashboard에서 **New > Blueprint**를 선택합니다.
2. GitHub의 `GUnT0x9/BugHunter` 저장소와 `main` branch를 선택합니다.
3. 저장소 root의 `render.yaml`을 사용합니다.
4. Blueprint가 요청하는 값을 입력합니다.
   - `WEB_ORIGIN`: 첫 생성에서는 `https://placeholder.invalid`
   - `ADMIN_EMAIL`: 실제 admin 로그인 email
   - `ADMIN_PASSWORD`: 12자 이상의 새 password
   - `ADMIN_USERNAME`: 화면에 표시할 admin 이름
5. PostgreSQL, Key Value, API가 모두 생성될 때까지 기다립니다.
6. API 주소와 `https://<api-address>/api/health`의 정상 응답을 확인합니다.

`ADMIN_PASSWORD`는 GitHub나 문서에 기록하지 않습니다. 최초 배포 hook이 migration과 45개 Mission,
admin 계정 seed를 수행합니다.

## 2. Vercel Web 배포

1. Vercel Dashboard에서 **Add New > Project**를 선택합니다.
2. 같은 GitHub 저장소를 Import합니다.
3. Root Directory는 저장소 root로 유지합니다.
4. `vercel.json`에서 build와 output 설정을 자동으로 읽는지 확인합니다.
5. Environment Variable을 추가합니다.
   - Key: `VITE_API_BASE_URL`
   - Value: `https://<api-address>/api`
6. Production Deploy를 실행하고 최종 `https://<project>.vercel.app` 주소를 복사합니다.

## 3. Render origin 확정

1. Render의 `bughunter-api` 서비스에서 `WEB_ORIGIN`을 최종 Vercel 주소로 변경합니다.
2. 주소 끝에는 `/`를 붙이지 않습니다.
3. API를 Manual Deploy 또는 Restart합니다.

## 4. 배포 확인

1. Vercel 주소에서 회원가입과 로그인을 확인합니다.
2. admin 계정으로 로그인해 `/admin/missions`에 45개 Mission이 표시되는지 확인합니다.
3. `https://<api-address>/api/health`가 `200`인지 확인합니다.
4. `https://<api-address>/api/health/ready`는 Worker가 없으므로 `503`이 정상입니다.
5. Mission 실행 또는 제출 시 `채점 서버가 준비되지 않았습니다`가 즉시 표시되는지 확인합니다.

브라우저가 third-party cookie를 차단해 로그인이 반복해서 풀리면 custom domain을 연결하거나 동일
origin API proxy를 추가해야 합니다. 운영 공개 전에는 유료 PostgreSQL/Key Value와 Docker 실행이
가능한 별도 Judge Worker를 준비합니다.

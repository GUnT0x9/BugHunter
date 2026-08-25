# Vercel + Render 배포 가이드

이 구성은 Vercel에 React/Vite Web을, Render에 NestJS API, PostgreSQL, Key Value를 배포합니다.
Render에서는 카드와 별도 Docker host 없이 `JUDGE_PROVIDER=judge0`을 사용해 원격으로
Python 코드를 실행합니다. 로컬 Docker Judge Worker 구성은 그대로 유지됩니다.

## 1. Render Blueprint 생성

1. Render Dashboard에서 **New > Blueprint**를 선택합니다.
2. GitHub의 `GUnT0x9/BugHunter` 저장소와 `main` branch를 선택합니다.
3. 저장소 root의 `render.yaml`을 사용합니다.
4. Blueprint가 요청하는 값을 입력합니다.
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
4. `vercel.ts`에서 build와 output 설정을 자동으로 읽는지 확인합니다.
5. 현재 Render API는 기본값 `https://bughunter-api-2o5c.onrender.com`으로 연결됩니다.
   API 주소가 바뀐 경우에만 `RENDER_API_ORIGIN`에 새 origin을 입력합니다.
6. Production Deploy를 실행하고 최종 `https://<project>.vercel.app` 주소를 복사합니다.

Web browser는 Vercel의 `/api`에만 요청하며 Vercel이 Render API를 reverse proxy합니다. 따라서
`VITE_API_BASE_URL`은 설정하지 않습니다.

## 3. Render origin 확정

1. `render.yaml`의 `WEB_ORIGIN`이 최종 Vercel 주소와 같은지 확인합니다.
2. 주소가 바뀌면 끝에 `/`를 붙이지 않고 값을 수정한 뒤 `main`에 push합니다.
3. Render Blueprint가 변경사항을 동기화하고 API를 재배포할 때까지 기다립니다.

## 4. 배포 확인

1. Vercel 주소에서 회원가입과 로그인을 확인합니다.
2. admin 계정으로 로그인해 `/admin/missions`에 45개 Mission이 표시되는지 확인합니다.
3. `https://<api-address>/api/health`가 `200`인지 확인합니다.
4. `https://<api-address>/api/health/ready`가 `200`이고 `judge: up`인지 확인합니다.
5. Mission의 visible test 실행과 정답 제출이 각각 최종 결과를 반환하는지 확인합니다.

Judge0 CE endpoint는 무료 shared API이며 제출 코드와 test input이 해당 서비스로 전달됩니다.
무료 정책, quota, endpoint는 사전 고지 없이 바뀔 수 있으므로
정식 운영 전에는 자체 Docker Judge Worker 또는 SLA가 있는 실행 서비스로 전환해야 합니다.

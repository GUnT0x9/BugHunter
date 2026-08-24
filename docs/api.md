# BugHunter API

모든 응답은 JSON이며 인증된 요청은 `bughunter.sid` HttpOnly cookie를 사용합니다.

- 회원가입 body: `{ "email": "hunter@example.com", "username": "버그탐정", "password": "8자 이상" }`
- 로그인 body: `{ "email": "hunter@example.com", "password": "8자 이상" }`
- 이메일은 소문자로 정규화하며 이메일과 닉네임은 각각 중복을 허용하지 않습니다.
- 로그인 성공 시 7일 만료의 HttpOnly session cookie를 발급하고, 활동 중에는 만료 시간을 연장합니다.
- 잘못된 로그인은 `401`, 중복 가입은 `409`, 잘못된 입력은 `400`을 반환합니다.

| Method | Path                            | 설명                                                 |
| ------ | ------------------------------- | ---------------------------------------------------- |
| POST   | `/auth/register`                | 이메일과 비밀번호로 가입                             |
| POST   | `/auth/login`                   | 로그인                                               |
| POST   | `/auth/logout`                  | 세션 제거                                            |
| GET    | `/auth/me`                      | 현재 사용자                                          |
| GET    | `/chapters`                     | Chapter와 진행 상태                                  |
| GET    | `/missions`                     | 필터 가능한 Mission 목록                             |
| GET    | `/missions/:id`                 | 공개 Mission 상세                                    |
| POST   | `/missions/:id/runs`            | 코드 실행 Job 생성                                   |
| POST   | `/missions/:id/submissions`     | 채점 Job 생성                                        |
| GET    | `/executions/:id`               | Run/Submit Job 상태                                  |
| GET    | `/submissions/:id`              | 테스트별 채점 결과와 XP 지급 결과                    |
| GET    | `/progress`                     | Dashboard용 학습 진행                                |
| GET    | `/bugdex`                       | 수집한 버그 유형                                     |
| GET    | `/statistics`                   | 학습 통계                                            |
| CRUD   | `/admin/missions`               | Admin Mission 생성·수정·삭제                         |
| POST   | `/admin/missions/:id/duplicate` | Mission 복제 (비공개 초안)                           |
| GET    | `/admin/missions/:id/preview`   | 테스트와 reference solution을 포함한 관리자 미리보기 |
| POST   | `/admin/missions/:id/validate`  | 공개 전 콘텐츠 구조 검증                             |
| PATCH  | `/admin/missions/:id/publish`   | 검증 통과 Mission 공개                               |

일반 Mission API와 Submission 조회는 hidden test의 input, expected output, actual output과 reference solution, 내부 컨테이너 정보를 절대 반환하지 않습니다. 실행 결과는 stdout, stderr, exit code, 실행 시간, 오류 유형만 반환합니다.

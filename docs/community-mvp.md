# 커뮤니티 MVP

## 목표

학습자가 다른 사용자의 성장을 확인하고, 친구 관계를 통해 재방문 동기를 얻을 수 있는 최소 커뮤니티 기능을 제공한다.

## 제공 기능

- XP 기준 전체 랭킹 상위 50명과 내 순위
- 닉네임 부분 일치 검색(2~32자, 최대 20명)
- 공개 사용자 프로필과 자기소개, 가입일, 최근 해결 활동
- 승인 없이 연결되는 단방향 팔로우와 팔로워·팔로잉 목록
- 랭킹, 검색, 친구 및 팔로우 목록에서 사용자 프로필로 이동
- 공개 정보는 닉네임, 자기소개, XP, 레벨, 해결 미션 및 최근 완료 활동로 제한

## 정책

- 동일 XP 사용자는 같은 순위로 표시한다.
- 자기 자신에게는 친구 요청을 보낼 수 없다.
- 팔로우는 단방향 관계이며 자기 자신을 팔로우할 수 없다.
- 이메일, 역할, 가입일과 세부 학습 이력은 커뮤니티 API에서 노출하지 않는다.

## API

- `GET /api/community/rankings`
- `GET /api/community/users?query={nickname}`
- `GET /api/community/users/:id`
- `GET /api/community/users/:id/follows`
- `POST /api/community/users/:id/follow`
- `DELETE /api/community/users/:id/follow`

## 후속 확장 후보

- 주간 XP 랭킹과 친구 랭킹
- 친구별 활동 피드와 축하 반응
- 차단 및 신고
- 알림 읽음 상태와 실시간 알림

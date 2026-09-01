# 커뮤니티 MVP

## 목표

학습자가 다른 사용자의 성장을 확인하고, 친구 관계를 통해 재방문 동기를 얻을 수 있는 최소 커뮤니티 기능을 제공한다.

## 제공 기능

- XP 기준 전체 랭킹 상위 50명과 내 순위
- 닉네임 부분 일치 검색(2~32자, 최대 20명)
- 친구 요청, 수락, 거절, 요청 취소, 친구 삭제
- 받은 요청·보낸 요청·친구 목록 구분
- 공개 정보는 닉네임, XP, 레벨, 해결 미션 수로 제한

## 정책

- 동일 XP 사용자는 같은 순위로 표시한다.
- 자기 자신에게는 친구 요청을 보낼 수 없다.
- 두 사용자 사이에는 방향과 관계없이 하나의 친구 레코드만 존재한다.
- 친구 요청은 수신자만 수락할 수 있다.
- 관계 당사자만 요청 또는 친구 관계를 삭제할 수 있다.
- 이메일, 역할, 가입일과 세부 학습 이력은 커뮤니티 API에서 노출하지 않는다.

## API

- `GET /api/community/rankings`
- `GET /api/community/users?query={nickname}`
- `GET /api/community/friends`
- `POST /api/community/friends/:userId`
- `POST /api/community/friendships/:id/accept`
- `DELETE /api/community/friendships/:id`

## 후속 확장 후보

- 주간 XP 랭킹과 친구 랭킹
- 사용자 공개 프로필
- 친구별 활동 피드와 축하 반응
- 차단 및 신고
- 알림 읽음 상태와 실시간 알림

# BUGhunter Design System

## 1. Atmosphere & Identity

BUGhunter는 터미널과 에디터가 만나는 조용한 사냥터다. 다크 차콜 베이스(#0b0e0c) 위에 에디터 패널이 떠 있고, 성공은 네온 그린(#3ecf8e)으로만 점등된다. 시그니처는 **긴장감 있는 밀도 대비** — 대시보드와 미션 목록은 숨을 크게 쉬고(넓은 여백, 큰 타이포), 워크스페이스의 3패널은 바짝 조여(좁은 거터, 고정 헤더) 집중을 강제한다. 방문자가 기억할 한 순간은 **에디터에 커서가 깜빡이고 오른쪽 가이드 패널에서 힌트 칩이 노란색으로 점등되는 2초**다.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Surface/bg | --bg | #0b0e0c | 페이지 배경 |
| Surface/bg-deep | --bg-deep | #070908 | 워크스페이스/코드 배경, 스크롤 트랙 |
| Surface/panel | --panel | #101310 | 패널, 카드, 사이드바 |
| Surface/panel-2 | --panel-2 | #151915 | 패널 헤더, 태그, 버튼 기본, 테스트 행 |
| Surface/panel-3 | --panel-3 | #1a1f1b | hover, 스크롤바 thumb hover |
| Border/default | --border | #232823 | 패널 외곽, 워크스페이스 그리드 구분선 |
| Border/subtle | --border-2 | #30362f | 입력, 태그, 버튼 테두리 |
| Text/primary | --text | #d7ded9 | 본문, 헤딩 |
| Text/secondary | --text-dim | #8b948e | 설명, 라벨, 보조 정보 |
| Text/tertiary | --text-faint | #5a625c | 플레이스홀더, 비활성, 메타 |
| Accent/primary | --green | #3ecf8e | 성공, 진행, 활성 네비, 포커스 링 |
| Accent/mid | --green-mid | #2ea86f | 버튼 테두리, 프로그레스 바 |
| Accent/dim | --green-dim | #0f2b1e | 성공 배너, 활성 네비 배경 |
| Accent/cyan | --cyan | #56b8d8 | 챕터 ID, 진행 링, 실행 중 상태 |
| Accent/amber | --amber | #d4a64e | 보스 태그, 힌트 칩, 대기 상태 |
| Accent/red | --red | #e06a5c | 에러, 실패 |
| Accent/red-dim | --red-dim | #331411 | 에러 진단 박스 배경 |

### Rules
- 배경은 단일 flat이 아니라 톤으로 깊이를 만든다: `bg-deep < panel-2 < panel` 의 3단 톤 시프트로 면을 분리, 보더는 보조 수단.
- Accent는 오직 인터랙션에만 사용: 그린은 성공/완료/활성, 시안은 진행/대기, 앰버는 힌트/경고, 레드는 실패. 장식용 그라데이션에 accent 남용 금지.
- 테이블에 없는 색상 도입 시 먼저 이 테이블에 추가.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | 30px | 800 | 1.1 | -0.02em | boot-brand |
| H1 page | clamp(22px,3vw,30px) | 750 | 1.2 | -0.02em | .page-title |
| H2 section | 17-19px | 750 | 1.3 | -0.01em | .section-heading, resume h2 |
| H3 label | 12.5-13px | 750 | 1.4 | 0 | 패널 h3, 가이드 h3, 메트릭 라벨 |
| Body | 14-15.5px | 400-700 | 1.55-1.7 | 0 | 본문, 카드 설명, 에디터 14px |
| Body/sm | 12-13.5px | 600-700 | 1.5 | 0 | 태그, 힌트, 테스트 행, 상태 |
| Caption | 11-12px | 600-800 | 1.4 | 0.02em | 오버라인, 코드 라인 넘버, 메타 |
| Overline | 11px | 600 | 1.3 | 0.08em | 대문자 라벨 (미사용, 예약) |

### Font Stack
- Primary: Pretendard Variable, system-ui, -apple-system, sans-serif ( `--sans` )
- Mono: ui-monospace, SFMono-Regular, Menlo, Consolas, Pretendard monospace ( `--mono` ) — 에디터, 콘솔, expected-box, t-diff

### Rules
- Pretendard 로드 유지, Inter로 폴백 금지.
- 본문 14px 미만 금지 (캡션/태그 제외).
- 4줄 이상 줄바꿈 되는 헤딩은 `clamp()` 로 축소.
- 숫자는 `tabular-nums` 고려 (스킬 바, XP 수치).

## 4. Spacing & Layout

### Base Unit
4px 베이스. 모든 의도적 여백은 4의 배수.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | 아이콘-라벨 간격 |
| --space-2 | 8px | 인라인 그룹, 테스트 행 gap |
| --space-3 | 12px | 패널 헤더 내부, 카드 메타 gap |
| --space-4 | 16px | 카드 패딩 기본, 에디터 헤더 패딩 |
| --space-5 | 20px | 패널 바디 패딩(20px) |
| --space-6 | 24px | 섹션 내부 여백 |
| --space-8 | 32px | 카드 그룹 간격 |
| --space-10 | 40px | 페이지 섹션 간격 |
| --space-12 | 48px | .page padding 최대 |
| --space-16 | 64px | 페이지 레벨 리듬 |
| --space-20 | 80px | 히어로/대시보드 상단 |

### Grid
- Max content width: 1080px (.page), 1280px 이상에서는 중앙 정렬
- 워크스페이스: `grid-template-columns: minmax(230px,0.8fr) minmax(400px,1.9fr) minmax(230px,0.8fr)` — 현재 좌우 패널이 230px 최소에서 협소, 중앙 에디터가 과도하게 넓음. 권장 조정: `0.9fr / 1.6fr / 0.9fr` 또는 `280px / 1fr / 320px` 로 좌우 밸런스 재조정.
- Breakpoints: 800px(사이드바 상단 전환), 1080px(워크스페이스 1단 스택), 768px/375px (모바일)
- Gutter: 8-14px (그리드 gap), 섹션 gap 13-26px

### Rules
- 토큰은 의도(여백 단계, 콘텐츠 폭, 거터)만 토큰화. 브라우저 메커니즘(`clamp()`, `minmax()`, `auto`, `%`)은 raw 유지.
- 대칭 패딩은 광학 보정 — 하단 패딩을 상단보다 2-4px 크게 잡아 시각적 중심을 맞춤.

## 5. Components

### Panel
- Structure: `.panel > .panel-bar(38px) + .panel-body(20px)`
- Variants: default, problem-panel(좌), guide-panel(우), editor-panel(중앙)
- Spacing: 바 0 16px, 바디 20px, h3 margin 24px 0 9px
- States: default, hover 없음 (정적 컨테이너)
- Motion: 없음

### Button
- Structure: `.btn` (inline-flex, gap 7px, border 1px, radius 6px, padding 9px 15px, font 13.5px/650)
- Variants: default(panel-2), primary(green-dim/green-mid), ghost(transparent)
- Spacing: 내부 9-15px, 그룹 gap 8px
- States: default, hover(panel-3/ #14402c), active(scale 0.98 미구현 → 추가 권장), focus(보더+그림자), disabled(opacity 0.5)
- Accessibility: 키보드 포커스 링 필요, 44px 터치 타깃 모바일에서 미달 → 패딩 확대 권장

### Tag
- Structure: `.tag` (inline-flex, gap 6px, padding 3px 9px, border 1px, radius 5px, font 12px/600)
- Variants: default, green, amber, cyan
- Spacing: 그룹 gap 7px, 내부 3-9px — 12px 대비 작아 밀도 높음. 권장: 5px 10px 로 확대
- States: 정적

### MissionCard
- Structure: `.mission-card` (flex, gap 16px, padding 15px 17px, radius 8px) > .mc-meta(92px) + .mc-body(flex1) + .mc-side
- Variants: default, locked(opacity 0.55)
- Spacing: 현재 15/17px 패딩은 1080px에서 적절하나 모바일에서 flex-wrap 시 .mc-side가 100%로 깨짐 — 간격 12px로 축소 권장
- States: hover(panel-2), locked, completed
- Sizing 이슈: .mc-title 15.5px/700, .mc-desc 12.5px — 계층 약함. 타이틀 16px, 설명 13px로 1.5px 격차 확대 권장. .mc-meta 92px 고정폭은 좁음 → 104px 권장

### Metric
- Structure: `.metric > .m-label(12.5px) + .m-value(26px/800) + .m-sub(12px)`
- Variants: default, green/amber
- Spacing: gap 6px, 그리드 gap 13px

### EditorPanel
- Structure: `.editor-panel` (grid 44px 헤더 + 1fr 에디터, min-height 480px)
- 헤더: `.editor-header` 44px, 파일명 13px/700, 우측 12px
- 이슈: 480px min-height는 13인치 노트북에서 워크스페이스 전체가 100vh를 넘어 스크롤 2중 발생. `min-height: min(480px, 56dvh)` 또는 `flex:1` 로 유연화 권장.

### TestRow
- Structure: `.test-row` (grid gap 6px, padding 10px 12px, radius 6px)
- States: passed/failed/pending (led 색 + verdict 색)
- Sizing: 10/12px 패딩은 12/13px 폰트 대비 타이트 — 12px 14px 로 완화 권장

### Statusbar/Sidebar
- Statusbar: 44px 고정, Sidebar 224px 고정, 네비 아이템 13px 14px
- 이슈: Sidebar 224px는 1280px에서 적절하나 1024px 이하에서 콘텐츠 압박 — 200px로 축소 또는 접힘 기능 권장

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 140ms | ease-out | 버튼 hover, 태그 |
| Standard | 220ms | ease-in-out | 패널 전환, 탭 |
| Emphasis | 320ms | cubic-bezier(0.16,1,0.3,1) | 성공 배너 pop |
| Led pulse | 1100ms | ease-in-out infinite | 실행 중 led |

### Rules
- `transform`, `opacity` 만 애니메이션. 레이아웃 속성 금지.
- 모든 인터랙티브에 hover + active + focus. 현재 active `scale(0.98)` 미구현 — 추가 필요.
- `prefers-reduced-motion` 준수 — led pulse 및 success-pop 비활성화.

## 7. Depth & Surface

### Strategy
Mixed — tonal-shift 메인 + borders 보조 + subtle shadow 없음.

- 배경: `bg-deep` → `panel-2` → `panel` 3단 톤으로 깊이. 보더(`--border`)는 1px 보조선으로만 사용.
- 패널/카드는 `box-shadow` 없음 — 톤 분리로 입체감. 모달/팝오버만 `0 8px 24px rgba(0,0,0,0.12)` 예약.
- 버튼/태그는 보더 1px로만 분리, 그림자 없음.

## 8. Accessibility Constraints & Accepted Debt

### Constraints
- WCAG 2.2 AA: 본문 4.5:1, 큰 텍스트 3:1, 모든 인터랙티브에 visible focus, 키보드 도달, `prefers-reduced-motion` 준수.
- 현재 --text #d7ded9 on --bg #0b0e0c 대비 약 14:1 충족. --text-dim #8b948e on --panel #101310 대비 약 6.2:1 충족.
- 에디터/콘솔은 mono 13px, 행간 1.7로 가독성 확보.

### Accepted Debt
| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| Sidebar 224px 고정폭이 1024px 이하에서 압박 | Sidebar | 레이아웃 스킬 미적용 상태, 접힘 기능 후순위 | 제거 시 `layout-skill` 적용 |
| 버튼 터치 타깃 44px 미달 (현재 34px) | .btn | 데스크탑 우선, 모바일 패딩 확대 예정 | 다음 사이징 패치에서 40px로 확대 |
| MissionCard .mc-desc 한 줄 말줄임으로 설명 잘림 | MissionDirectory | 목록 밀도 유지 목적, 상세는 Workspace에서 확인 | 추후 2줄 clamp로 완화 검토 |


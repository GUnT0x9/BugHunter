# CodeTrace Design System

## 0. Research Log

| Lane | Source | Deliverable |
|------|--------|-------------|
| Live site extraction | https://codeup.kr (2026-08, HTML fetch) | 레이아웃 문법: 고정 상단바(단색, 링크 나열) → 컨테이너 중앙 정렬(max-w-7xl) → **헤더바 있는 박스 섹션**(header `border-b` + body `p-6`) → **행 기반 밀집 목록**(row마다 `border-bottom`, 좌측 번호+제목 / 우측 메타). 플로팅 카드 없음. 섀도 최소, 모서리 작음 |
| User brief (2026-08-26) | 사용자 지시 | 카드형식 폐기 / 블랙 배경 / 네온 그린 포인트 / 본문은 대부분 흰색 / 에디터는 Monaco 유지·재테마 |

## 1. Atmosphere & Identity

CodeTrace는 **순흑 터미널 위의 온라인 저지(OJ)** 다. 코드업의 정보 중심 밀도 — 헤더바가 붙은 사각 섹션, 번호·제목·상태가 열을 이루는 표 목록 — 를 순흑(`#050505`대) 캔버스에 얹는다. 성공과 살아있는 상태만이 네온 그린으로 점등되고, 나머지 글자는 전부 흰색 계열이다. 시그니처는 **행이 아닌 빛의 위계**: 목록에서 hover된 행의 좌측 코드(CH.-M.)와 상태 LED가 같이 켜지는 순간. 장식 그라데이션·글래스·플로팅 카드는 금기다.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Surface/bg | --bg | #050705 | 페이지 배경 (순흑 근접) |
| Surface/bg-deep | --bg-deep | #000000 | 코드 에디터, 콘솔, expected-box (순흑) |
| Surface/panel | --panel | #090c09 | 패널/섹션 본체 |
| Surface/panel-2 | --panel-2 | #0d110d | 패널 헤더바, 입력, 테이블 헤더 행 |
| Surface/hover | --panel-3 | #121712 | hover 행, thumb hover |
| Border/default | --border | #1d231d | 섹션 외곽, 행 구분선 |
| Border/subtle | --border-2 | #2a332a | 입력, 태그, 버튼 테두리 |
| Text/primary | --text | #f2f5f2 | 본문·헤딩 (거의 순백) |
| Text/secondary | --text-dim | #a3aea3 | 설명, 라벨 |
| Text/tertiary | --text-faint | #7f8c7e | 메타, 비활성 (AA 5.4:1+) |
| Accent/neon | --green | #48ff9b | 네온 그린 포인트: 활성 네비, 성공, LED, 링크 강조 |
| Accent/neon-bright | --green-bright | #8cffbc | hover시 밝아지는 그린 텍스트 |
| Accent/mid | --green-mid | #27c46b | 프로그레스 fill, 버튼 보더 |
| Accent/tint | --green-dim | #07271a | 성공 배너·활성 배경 틴트 |
| Accent/amber | --amber | #ffb454 | 보스, 힌트, 대기 상태 (보조 신호 한정) |
| Accent/red | --red | #ff6b5e | 에러, 실패 |
| Accent/red-dim | --red-dim | #2a0f0c | 에러 배경 틴트 |
| Glow | --glow-green | 0 0 10px rgba(72,255,155,.28) | 활성 요소의 단일 발광 (signature) |
| Border/hover | --border-hover | #39443a | 입력 hover 보더 |
| Surface/focus | --bg-focus | #081209 | 입력 포커스 배경 틴트 |

※ 구 시안(cyan #56b8d8)은 폐기. 진행중 상태는 그린 LED가 담당하고, cyan 자리는 전부 text-dim 또는 green으로 흡수한다.

### Rules
- 면 분리는 톤 시프트(`bg < panel < panel-2`) + 1px 보더로만. `box-shadow`(발광 제외) 금지, gradient 배경 금지.
- 네온 그린은 **상태·인터랙션·포인트에만** 발광한다: 활성 네비, 현재 행, 성공, LED, 포커스 링, 프라이머리 버튼. 대량 배경 채움 금지.
- 본문 텍스트는 항상 --text(백색). 색 텍스트는 신호일 때만(--green/--red/--amber).
- 새 색 도입 전 이 테이블에 추가. 하드코딩 헥스 금지 (모나코 테마 파일 제외).

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 26-30px | 800 | 1.15 | boot-brand, auth-hero-title |
| H1 page | clamp(22px,3vw,28px) | 750 | 1.2 | .page-title |
| H2 section | 17-19px | 750 | 1.3 | resume h2, section-heading |
| H3 label | 12.5-13px | 750 | 1.4 | 패널 h3, 가이드 h3 |
| Body | 14-15px | 400-700 | 1.55-1.7 | 본문 |
| Meta/mono | 11-13px | 600-800 | 1.5 | 코드(CH.-M.), LED 옆 라벨, 테이블 메타 — `--mono` 필수 |
| Caption | 11-12px | 600-800 | 1.4 | 오버라인, 행 번호 |

### Font Stack
- Primary: Pretendard Variable (`--sans`)
- Mono: ui-monospace, SFMono-Regular, Menlo, Consolas (`--mono`) — 에디터, 콘솔, **목록의 미션 코드·카운트 등 메타 데이터**

### Rules
- Pretendard 로드 유지. Inter 폴백 금지.
- 목록 밀도가 심장이다: 행 높이 44-52px, 줄바꿈 금지(truncate), 메타는 mono.
- 전역 `word-break: keep-all` + `overflow-wrap: break-word` — 한국어 어절 단위 줄바꿈 보장 (코드/콘솔 영역은 자체 break-word 규칙으로 예외).

## 4. Spacing & Layout

### Base Unit
4px 베이스.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1..20 | 4/8/12/16/20/24/32/40/48/64/80px | 기존 스케일 유지 |
| --topbar-h | 56px | 상단 고정바 |
| Row height | 44-52px | 목록 행 표준 |

### Grid
- Max content width: 1080px(.page) — 코드업의 container 문법과 동일한 중앙 단일 컬럼.
- 워크스페이스 3패널 그리드 유지: `minmax(280px,.95fr) minmax(460px,1.45fr) minmax(300px,.9fr)` (1080px에서 1단 스택).
- Breakpoints: 1080px(워크스페이스 스택), 900px(topbar 2행), 800px(메트릭 1열), 760px(admin 스택).

### Rules
- 반경(radius) 체계: 섹션/패널 4px, 버튼/입력 4px, 태그 3px, LED/배지 99px. **8px 이상 금지** — 각진 OJ 질감.
- 목록은 반드시 **하나의 컨테이너 안의 행들**(행 사이 border-bottom). 행마다 개별 보더·배경·radius를 주는 카드 문법 금지.

## 5. Components

### SectionBox (구 Panel)
- Structure: `.panel > .panel-bar(min-height 42px) + .panel-body`
- Look: panel 배경, 외곽 1px 보더, radius 4px, 헤더바는 panel-2 + border-bottom. 코드업의 `header(border-b) + body(p-6)` 박스와 동일 문법.
- States: 정적 컨테이너 (hover 없음)

### ListTable (신규 — 카드의 대체)
- Structure: `.list-table > .lt-head(헤더 행) + button.lt-row*(데이터 행)`
- Row anatomy: `[상태 20px] [코드 mono 110px] [제목 flex] [분류 tag] [난이도 ★] [액션]`
- States: default(LED 회색), hover(panel-3 배경 + 좌측 코드·LED 네온 점등 동시), locked(opacity .5), completed(LED green 고정)
- Rows are separated by `border-bottom: 1px solid var(--border)`; 마지막 행 제외. 행 자체 radius/보더 없음.
- Used by: MissionDirectory, BugDex, (Roadmap은 ChapterGroup 내부에서 동일 행 문법 재사용)

### ChapterGroup
- Structure: `.chapter-group > .cg-head(CH.{n} · 이름 · n/n) + .cg-body(mission-node 행들)`
- mission-node: 행 문법(하단 보더), 좌측 아이콘(상태), 제목, 우측 M.{order} mono. rounded pill 아님.

### Button
- `.btn`: radius 4px, border 1px border-2, padding 9px 16px, font 13.5px/650
- Variants: default(panel-2), primary(**--green 배경 + 검정 텍스트 #04140b**, hover green-bright), ghost, danger
- States: hover(배경/보더 시프트), active(scale .98), focus-visible(2px --green outline), disabled(opacity .5)
- Motion: 140ms ease (color/bg/border 만)

### Tag
- `.tag`: radius 3px, padding 3px 8px, font 12px/650, mono 숫자 허용
- Variants: default, green(neon 틴트), amber, red

### Metric
- `.metric > .m-label + .m-value(26px/800 tabular-nums) + .m-sub`
- 값 색은 신호일 때만(green/amber), 기본 --text.

### EditorPanel
- Monaco `bughunter-terminal` 테마: bg #050805, foreground #f2f5f2, cursor/line-number active = neon green, keyword/string/number = green·amber 계열 3색 제한.
- 헤더 44px, min-height clamp(400px,48dvh,560px).

### ConsoleRow / TestRow
- 콘솔 라인: mono 13px, ok=green err=red warn=amber info=faint.
- TestRow: `.test-list > .test-row` 행 문법(행 사이 border-bottom만, per-row 보더·배경·radius 없음), verdict 색 = passed green / failed red / pending faint.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 140ms | ease | 버튼/행/태그 hover |
| Standard | 200ms | ease-in-out | 탭 전환 |
| Emphasis | 260ms | ease-out | success-pop |
| Led pulse | 1100ms | ease-in-out infinite | 실행 중 LED |
| Neon breathe | 2.4s ease-in-out infinite | 활성 네비 dot의 미세 발광 (유일한 장식 모션) |

- transform/opacity만 애니메이션. `prefers-reduced-motion` 시 전부 비활성.
- hover가 아무것도 바꾸지 않으면 결함으로 간주 (행 hover = 배경 + 코드/LED 점등 동시).

## 7. Depth & Surface

- 전략: **tonal-shift + 1px 보더 + 선택적 네온 발광**. box-shadow(발광 제외) 없음.
- 발광(--glow-green)은 페이지당 눈에 띄는 1-2곳: 활성 네비, 프라이머리 CTA, 성공 배너. 남발 시 결함.
- 코드/콘솔 영역은 --bg-deep(순흑)으로 화면 최암부를 만들어 에디터가 무대임을 보여준다.

## 8. Accessibility Constraints & Accepted Debt

### Constraints
- WCAG 2.2 AA: --text #f2f5f2 on #050705 ≈ 17:1. --text-dim ≈ 8.5:1. --text-faint #7f8c7e ≥ 5.4:1. --green #48ff9b on black ≈ 15:1. primary 버튼 텍스트 #04140b on #48ff9b ≈ 12:1. 본문·메타 텍스트 전부 충족.
- 모든 인터랙티브 focus-visible 2px --green ring. 키보드 도달 보장.
- prefers-reduced-motion 준수.

### Accepted Debt
| Item | Location | Why accepted | Exit |
|------|----------|--------------|------|
| admin 스타디오 일부 레거시 헥스(#0f1310 등) 잔존 가능 | Admin* 컴포넌트 | 토큰 전환 우선, 관리자 전용 화면 | 다음 admin 정비 시 토큰화 |
| 목록 행에서 description truncate 1줄 | ListTable | 밀도 우선, 상세는 Workspace | 필요 시 2줄 clamp |
| 버튼 터치 타깃 38px (44px 미달) | .btn | 데스크탑 우선 서비스 | 모바일 패딩 확대 패치 |
| padding/margin 쇼핑핸드 px 유지 | styles.css 전반 | gap/radius 토큰화 1단계 완료, 쇼핑핸드 치환은 2단계 | 다음 스타일 정비 시 --space-* 치환 |

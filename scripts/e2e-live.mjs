import { chromium, request } from 'playwright';

const baseURL = process.env.E2E_BASE_URL ?? 'https://debugrove.vercel.app';
const stamp = Date.now().toString(36);
const password = `E2e!${stamp}Safe`;
const checks = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function json(response, label, expected) {
  const body = await response.text();
  const accepted =
    expected === undefined
      ? response.status() >= 200 && response.status() < 300
      : response.status() === expected;
  assert(accepted, `${label}: HTTP ${response.status()} ${body.slice(0, 240)}`);
  checks.push(label);
  return body ? JSON.parse(body) : null;
}
async function register(suffix) {
  const context = await request.newContext({ baseURL });
  const user = await json(
    await context.post('/api/auth/register', {
      data: {
        email: `e2e-${stamp}-${suffix}@example.com`,
        username: `e2e_${stamp}_${suffix}`,
        password,
      },
    }),
    `회원가입 ${suffix}`,
  );
  return { context, user };
}
async function pollExecution(context, executionId) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const response = await context.get(`/api/executions/${executionId}`);
    const result = await json(response, `채점 조회 ${attempt + 1}`);
    if (!['QUEUED', 'RUNNING'].includes(result.status)) return result;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('채점이 90초 안에 끝나지 않았습니다.');
}

const first = await register('a');
const second = await register('b');
let browser;
try {
  await json(await first.context.get('/api/auth/me'), '현재 사용자');
  await json(
    await first.context.patch('/api/auth/me', {
      data: { username: first.user.username, bio: 'E2E 자동 점검 계정' },
    }),
    '프로필 수정',
  );
  const missions = await json(await first.context.get('/api/missions'), '문제 목록');
  assert(Array.isArray(missions) && missions.length >= 45, '공개 문제가 45개 미만입니다.');
  const mission = missions.find((item) => !item.isLocked);
  assert(mission, '시작 가능한 문제가 없습니다.');

  for (const [path, label] of [
    ['/api/progress', '진행도'],
    ['/api/bugdex', '버그 도감'],
    ['/api/mastery', '숙련도'],
    ['/api/achievements', '업적'],
    ['/api/quests', '퀘스트'],
    ['/api/statistics', '통계'],
    ['/api/community/rankings', '누적 랭킹'],
    ['/api/community/season-rankings', '시즌 랭킹'],
    ['/api/challenges/cooperative', '협동 챌린지'],
    ['/api/challenges/community-event', '카테고리 이벤트'],
    ['/api/duels/active', '활성 대결'],
    ['/api/duels/history', '대결 전적'],
  ])
    await json(await first.context.get(path), label);

  const users = await json(
    await first.context.get(
      `/api/community/users?query=${encodeURIComponent(second.user.username)}`,
    ),
    '사용자 검색',
  );
  assert(
    users.some((item) => item.id === second.user.id),
    '생성한 사용자가 검색되지 않습니다.',
  );
  await json(await first.context.post(`/api/community/users/${second.user.id}/follow`), '팔로우');
  const follows = await json(
    await first.context.get(`/api/community/users/${first.user.id}/follows`),
    '팔로우 목록',
  );
  assert(
    follows.following.some((item) => item.id === second.user.id),
    '팔로잉 목록에 사용자가 없습니다.',
  );
  await json(
    await first.context.delete(`/api/community/users/${second.user.id}/follow`),
    '언팔로우',
  );

  const run = await json(
    await first.context.post(`/api/missions/${mission.id}/runs`, {
      data: { code: mission.initialCode, input: mission.visibleTests[0]?.input ?? '' },
    }),
    '코드 실행 생성',
  );
  await pollExecution(first.context, run.executionId);
  const submission = await json(
    await first.context.post(`/api/missions/${mission.id}/submissions`, {
      data: { code: mission.initialCode },
    }),
    '정답 제출 생성',
  );
  await pollExecution(first.context, submission.executionId);

  const room = await json(
    await first.context.post('/api/duels', { data: { missionId: mission.id } }),
    '대결방 생성',
  );
  const joined = await json(
    await second.context.post('/api/duels/join', { data: { code: room.code } }),
    '대결방 참가',
  );
  assert(
    joined.status === 'ACTIVE' && joined.participants.length === 2,
    '대결이 정상 시작되지 않았습니다.',
  );

  const admin = await request.newContext({ baseURL });
  await json(
    await admin.post('/api/auth/login', {
      data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    }),
    '관리자 로그인',
  );
  const adminMissions = await json(await admin.get('/api/admin/missions'), '관리자 문제 목록');
  assert(adminMissions.length > 0, '관리자 문제 목록이 비었습니다.');
  const draft = await json(
    await admin.post('/api/admin/missions/draft', {
      data: { chapterId: adminMissions[0].chapterId, bugTypeId: adminMissions[0].bugTypeId },
    }),
    '관리자 문제 초안 생성',
  );
  await json(await admin.delete(`/api/admin/missions/${draft.id}`), '관리자 문제 초안 삭제');
  const logs = await json(
    await admin.get('/api/admin/submissions?page=1&limit=10'),
    '관리자 제출 로그',
  );
  assert(Array.isArray(logs.items) && logs.summary, '제출 로그 응답 형식이 올바르지 않습니다.');
  if (logs.items[0])
    await json(await admin.get(`/api/admin/submissions/${logs.items[0].id}`), '관리자 제출 상세');

  browser = await chromium.launch({ headless: true });
  const storageState = await admin.storageState();
  const browserContext = await browser.newContext({
    storageState,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await browserContext.newPage();
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on('response', (response) => {
    if (response.status() >= 500)
      browserErrors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      browserErrors.push(`console: ${message.text()}`);
  });
  const routes = [
    '/',
    '/learn',
    '/problems',
    '/bugdex',
    '/achievements',
    '/quests',
    '/my',
    '/statistics',
    '/search',
    '/rankings',
    '/challenges',
    '/challenges/duel',
    '/challenges/co-op',
    '/challenges/event',
    '/admin/missions',
    '/admin/submissions',
  ];
  for (const route of routes) {
    const errorsBefore = browserErrors.length;
    const response = await page.goto(`${baseURL}${route}`, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });
    assert(response?.status() === 200, `화면 ${route}: HTTP ${response?.status()}`);
    await page.locator('main, section.page').first().waitFor({ state: 'visible', timeout: 20_000 });
    checks.push(`화면 ${route}`);
    if (browserErrors.length > errorsBefore) browserErrors.push(`위 오류 발생 화면: ${route}`);
  }
  assert(browserErrors.length === 0, `브라우저 오류:\n${browserErrors.join('\n')}`);
  await browserContext.close();
  await admin.dispose();
  console.log(`E2E PASS: ${checks.length} checks (${baseURL})`);
} finally {
  await browser?.close();
  await first.context.dispose();
  await second.context.dispose();
}

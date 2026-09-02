export type AchievementGroup =
  | 'START'
  | 'COLLECTION'
  | 'PERFECT'
  | 'NO_HINT'
  | 'FIRST_TRY'
  | 'CATEGORY'
  | 'BOSS'
  | 'STREAK'
  | 'EXPLORATION'
  | 'GROWTH'
  | 'COMEBACK'
  | 'SPEED'
  | 'COMMUNITY'
  | 'SEASON'
  | 'SECRET';

export type AchievementDefinition = {
  code: string;
  group: AchievementGroup;
  title: string;
  description: string;
  metric: string;
  target: number;
  secret?: boolean;
  comingSoon?: boolean;
};

export type AchievementRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export function achievementRarity(definition: AchievementDefinition): AchievementRarity {
  if (
    definition.secret ||
    [
      'SOLVED_45',
      'STARS_120',
      'PERFECT_30',
      'NOHINT_30',
      'FIRSTTRY_20',
      'BOSS_PERFECT_ALL',
      'MAXSTREAK_30',
      'LEVEL_20',
      'XP_30000',
      'COMEBACKS_15',
    ].includes(definition.code) ||
    (definition.group === 'CATEGORY' && definition.target === 100)
  )
    return 'LEGENDARY';
  if (
    definition.comingSoon ||
    [
      'SOLVED_30',
      'STARS_75',
      'PERFECT_15',
      'NOHINT_15',
      'FIRSTTRY_10',
      'BOSSSOLVED_9',
      'MAXSTREAK_14',
      'LEVEL_10',
      'XP_10000',
      'DAILYBEST_5',
    ].includes(definition.code)
  )
    return 'EPIC';
  if (definition.target > 1 || definition.group === 'CATEGORY') return 'RARE';
  return 'COMMON';
}

const tier = (
  group: AchievementGroup,
  metric: string,
  values: number[],
  titles: string[],
  description: (value: number) => string,
): AchievementDefinition[] =>
  values.map((target, index) => ({
    code: `${metric.toUpperCase()}_${target}`,
    group,
    metric,
    target,
    title: titles[index]!,
    description: description(target),
  }));

export const BASE_ACHIEVEMENTS: AchievementDefinition[] = [
  ...tier(
    'COLLECTION',
    'solved',
    [1, 5, 15, 30, 45],
    ['첫 디버깅', '워밍업 완료', '버그 수집가', '숙련 디버거', '도감 완성'],
    (n) => `문제 ${n}개 해결`,
  ),
  ...tier(
    'COLLECTION',
    'stars',
    [30, 75, 120],
    ['별빛 추적자', '별의 항로', '별의 정점'],
    (n) => `별 ${n}개 획득`,
  ),
  ...tier(
    'PERFECT',
    'perfect',
    [1, 5, 15, 30],
    ['완벽한 첫걸음', '정밀 수리공', '완벽주의자', '결점 없는 코드'],
    (n) => `3성 문제 ${n}개 달성`,
  ),
  ...tier(
    'NO_HINT',
    'noHint',
    [5, 15, 30],
    ['독립 조사관', '무전 지원', '맨눈의 디버거'],
    (n) => `힌트 없이 ${n}문제 해결`,
  ),
  ...tier(
    'FIRST_TRY',
    'firstTry',
    [3, 10, 20],
    ['첫눈에 포착', '원샷 텐', '예측 실행'],
    (n) => `첫 제출로 ${n}문제 해결`,
  ),
  ...tier(
    'BOSS',
    'bossSolved',
    [1, 3, 9],
    ['첫 보스 격파', '보스 헌터', '보스 소탕'],
    (n) => `보스 ${n}개 해결`,
  ),
  {
    code: 'BOSS_PERFECT_ALL',
    group: 'BOSS',
    metric: 'bossPerfect',
    target: 9,
    title: '왕관 없는 왕',
    description: '모든 보스를 3성으로 해결',
  },
  ...tier(
    'STREAK',
    'maxStreak',
    [3, 7, 14, 30],
    ['시동 유지', '일주일 루틴', '두 주의 집념', '한 달의 흔적'],
    (n) => `${n}일 연속 학습`,
  ),
  ...tier(
    'GROWTH',
    'level',
    [5, 10, 20],
    ['레벨 업', '두 자릿수', '베테랑'],
    (n) => `레벨 ${n} 달성`,
  ),
  ...tier(
    'GROWTH',
    'xp',
    [5000, 10000, 30000],
    ['경험 축적', '만 단위 디버거', '경험의 증명'],
    (n) => `${n.toLocaleString()} XP 달성`,
  ),
  ...tier(
    'COMEBACK',
    'comebacks',
    [1, 5, 15],
    ['다시 읽기', '복구 전문가', '실패는 로그일 뿐'],
    (n) => `실패 후 ${n}문제 해결`,
  ),
  ...tier(
    'SPEED',
    'dailyBest',
    [3, 5],
    ['오늘의 질주', '디버깅 스프린트'],
    (n) => `하루에 ${n}문제 해결`,
  ),
  {
    code: 'EXPLORE_CATEGORIES',
    group: 'EXPLORATION',
    metric: 'touchedCategories',
    target: 7,
    title: '전 영역 탐사',
    description: '모든 버그 카테고리 해결 경험',
  },
  {
    code: 'EXPLORE_CHAPTERS',
    group: 'EXPLORATION',
    metric: 'touchedChapters',
    target: 9,
    title: '전체 구역 개방',
    description: '모든 챕터에서 문제 해결',
  },
  ...tier('COMMUNITY', 'following', [1, 5], ['첫 연결', '디버거 네트워크'], (n) => `${n}명 팔로우`),
  ...tier(
    'COMMUNITY',
    'followers',
    [5, 20],
    ['관심받는 기록', '커뮤니티 신호'],
    (n) => `팔로워 ${n}명 달성`,
  ),
  {
    code: 'COMMUNITY_COOP',
    group: 'COMMUNITY',
    metric: 'coop',
    target: 1,
    title: '공동 전선',
    description: '협동 목표 참여',
  },
  {
    code: 'SEASON_START',
    group: 'SEASON',
    metric: 'seasonSolved',
    target: 1,
    title: '시즌 체크인',
    description: '시즌 문제 첫 해결',
    comingSoon: true,
  },
  {
    code: 'SEASON_QUEST',
    group: 'SEASON',
    metric: 'seasonQuest',
    target: 1,
    title: '시즌 완주자',
    description: '시즌 퀘스트 완주',
    comingSoon: true,
  },
  {
    code: 'SECRET_MIDNIGHT',
    group: 'SECRET',
    metric: 'midnight',
    target: 1,
    title: '심야 디버거',
    description: '자정부터 새벽 2시 사이에 문제 해결',
    secret: true,
  },
  {
    code: 'SECRET_SEVENTH',
    group: 'SECRET',
    metric: 'seventhTry',
    target: 1,
    title: '일곱 번째 로그',
    description: '정확히 7번째 제출에 문제 해결',
    secret: true,
  },
  {
    code: 'SECRET_SWEEP',
    group: 'SECRET',
    metric: 'dailyCategories',
    target: 7,
    title: '하루 만에 전 영역',
    description: '하루에 모든 버그 카테고리 해결',
    secret: true,
  },
  {
    code: 'SECRET_BOSS',
    group: 'SECRET',
    metric: 'perfectBoss',
    target: 1,
    title: '흔적 없는 보스전',
    description: '보스를 첫 제출·노힌트로 해결',
    secret: true,
  },
  {
    code: 'SECRET_45_LOGS',
    group: 'SECRET',
    metric: 'totalAttempts',
    target: 45,
    title: '마흔다섯 개의 로그',
    description: '누적 제출 45회 달성',
    secret: true,
  },
];

export function evaluateAchievements(
  metrics: Record<string, number>,
  categoryMetrics: Array<{ slug: string; name: string; percentage: number }>,
) {
  const categoryAchievements: AchievementDefinition[] = categoryMetrics.flatMap((category) =>
    [50, 100].map((target) => ({
      code: `CATEGORY_${category.slug.toUpperCase()}_${target}`,
      group: 'CATEGORY' as const,
      metric: `category:${category.slug}`,
      target,
      title: target === 100 ? `${category.name} 마스터` : `${category.name} 전문가`,
      description: `${category.name} 숙련도 ${target}%`,
    })),
  );
  return [...BASE_ACHIEVEMENTS, ...categoryAchievements].map((definition) => {
    const progress = definition.metric.startsWith('category:')
      ? (categoryMetrics.find((item) => `category:${item.slug}` === definition.metric)
          ?.percentage ?? 0)
      : (metrics[definition.metric] ?? 0);
    const unlocked = !definition.comingSoon && progress >= definition.target;
    return {
      ...definition,
      title: definition.secret && !unlocked ? '???' : definition.title,
      description:
        definition.secret && !unlocked
          ? '숨겨진 조건을 만족하면 공개됩니다.'
          : definition.description,
      progress: definition.secret && !unlocked ? 0 : Math.min(progress, definition.target),
      rarity: achievementRarity(definition),
      unlocked,
    };
  });
}

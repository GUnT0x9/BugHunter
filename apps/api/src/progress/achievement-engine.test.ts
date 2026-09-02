import { describe, expect, it } from 'vitest';
import { achievementRarity, evaluateAchievements } from './achievement-engine.js';

describe('achievement engine', () => {
  it('retroactively unlocks achievements from current metrics', () => {
    const result = evaluateAchievements({ solved: 5, perfect: 1 }, [
      { slug: 'logic', name: 'Logic Bug', percentage: 50 },
    ]);
    expect(result.find((item) => item.code === 'SOLVED_5')?.unlocked).toBe(true);
    expect(result.find((item) => item.code === 'PERFECT_1')?.unlocked).toBe(true);
    expect(result.find((item) => item.code === 'CATEGORY_LOGIC_50')?.unlocked).toBe(true);
  });

  it('keeps secret details hidden until their condition is met', () => {
    const locked = evaluateAchievements({}, []).find((item) => item.code === 'SECRET_MIDNIGHT');
    const unlocked = evaluateAchievements({ midnight: 1 }, []).find(
      (item) => item.code === 'SECRET_MIDNIGHT',
    );
    expect(locked).toMatchObject({ title: '???', progress: 0, unlocked: false });
    expect(unlocked).toMatchObject({ title: '심야 디버거', unlocked: true });
  });

  it('does not unlock achievements whose backing system is not live yet', () => {
    expect(
      evaluateAchievements({ seasonSolved: 99 }, []).find((item) => item.code === 'SEASON_START'),
    ).toMatchObject({ comingSoon: true, unlocked: false });
  });

  it('assigns rarity from the difficulty of the condition', () => {
    expect(
      achievementRarity({
        code: 'SOLVED_1',
        group: 'COLLECTION',
        metric: 'solved',
        target: 1,
        title: '첫 디버깅',
        description: '문제 1개 해결',
      }),
    ).toBe('COMMON');
    expect(
      achievementRarity({
        code: 'CATEGORY_LOGIC_100',
        group: 'CATEGORY',
        metric: 'category:logic',
        target: 100,
        title: 'Logic 마스터',
        description: '숙련도 100%',
      }),
    ).toBe('LEGENDARY');
  });
});

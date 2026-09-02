import { describe, expect, it } from 'vitest';
import { cappedSolveTimeSeconds, compareSeasonScores, seasonPeriod } from './season-policy.js';

describe('season policy', () => {
  it('uses four-week seasons beginning on Monday at Seoul midnight', () => {
    const season = seasonPeriod(new Date('2026-09-02T00:00:00Z'));
    expect(season).toMatchObject({ key: 'S1', number: 1 });
    expect(season.startsAt.toISOString()).toBe('2026-08-30T15:00:00.000Z');
    expect(season.endsAt.toISOString()).toBe('2026-09-27T15:00:00.000Z');
  });

  it('caps abandoned problem time at 24 hours', () => {
    expect(
      cappedSolveTimeSeconds(new Date('2026-09-01T00:00:00Z'), new Date('2026-09-03T00:00:00Z')),
    ).toBe(86_400);
  });

  it('sorts by stars, solves, speed, perfect clears, then attempts', () => {
    const base = {
      earnedStars: 10,
      solvedCount: 4,
      averageSolveTimeSeconds: 100,
      perfectCount: 2,
      totalAttempts: 7,
      username: '가',
    };
    expect(compareSeasonScores({ ...base, earnedStars: 11 }, base)).toBeLessThan(0);
    expect(compareSeasonScores({ ...base, averageSolveTimeSeconds: 90 }, base)).toBeLessThan(0);
    expect(compareSeasonScores({ ...base, totalAttempts: 6 }, base)).toBeLessThan(0);
  });
});

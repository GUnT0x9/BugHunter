import { describe, expect, it } from 'vitest';
import { duelRewardAmount, koreanDayStart } from './duel.service.js';

describe('duel reward policy', () => {
  it('awards 50 XP for an eligible win', () => expect(duelRewardAmount(100, 1)).toBe(50));
  it('respects the daily cap', () => expect(duelRewardAmount(280, 0)).toBe(20));
  it('blocks a fourth reward against the same opponent', () =>
    expect(duelRewardAmount(0, 3)).toBe(0));
  it('uses midnight in Korea as the daily boundary', () =>
    expect(koreanDayStart(new Date('2026-09-03T02:00:00.000Z')).toISOString()).toBe(
      '2026-09-02T15:00:00.000Z',
    ));
});

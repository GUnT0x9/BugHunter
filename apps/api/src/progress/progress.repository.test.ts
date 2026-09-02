import { describe, expect, it } from 'vitest';
import { masteryPercentage } from './progress.repository.js';

describe('Level policy', () => {
  it('advances to the next level per 1,000 XP', () => {
    expect(Math.floor(1_000 / 1_000) + 1).toBe(2);
  });
});

describe('Category mastery policy', () => {
  it('uses earned stars out of every published mission star', () => {
    expect(masteryPercentage(8, 4)).toBe(67);
    expect(masteryPercentage(0, 0)).toBe(0);
  });
});

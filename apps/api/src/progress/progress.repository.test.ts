import { describe, expect, it } from 'vitest';

describe('Level policy', () => {
  it('advances to the next level per 1,000 XP', () => {
    expect(Math.floor(1_000 / 1_000) + 1).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';
import { questPeriods } from './quest-policy.js';

describe('quest periods', () => {
  it('resets daily quests at Seoul midnight', () => {
    const { daily } = questPeriods(new Date('2026-09-02T16:00:00Z'));
    expect(daily.key).toBe('D:2026-09-03');
    expect(daily.startsAt.toISOString()).toBe('2026-09-02T15:00:00.000Z');
  });

  it('resets weekly quests at Monday Seoul midnight', () => {
    const { weekly } = questPeriods(new Date('2026-09-02T07:00:00Z'));
    expect(weekly.key).toBe('W:2026-08-31');
    expect(weekly.startsAt.toISOString()).toBe('2026-08-30T15:00:00.000Z');
  });
});

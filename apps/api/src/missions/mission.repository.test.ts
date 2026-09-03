import { describe, expect, it } from 'vitest';
import { isMissionLocked } from './mission.repository.js';

describe('isMissionLocked', () => {
  it('unlocks every Mission for an admin without completion progress', () => {
    expect(isMissionLocked('ADMIN', 7, 'previous', null, new Set())).toBe(false);
  });

  it('unlocks all Missions for learners without sequential gating', () => {
    expect(isMissionLocked('USER', 1, null, null, new Set())).toBe(false);
    expect(isMissionLocked('USER', 2, 'previous', null, new Set())).toBe(false);
    expect(isMissionLocked('USER', 3, null, 'boss', new Set())).toBe(false);
  });
});

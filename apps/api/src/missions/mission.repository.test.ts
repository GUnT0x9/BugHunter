import { describe, expect, it } from 'vitest';
import { isMissionLocked } from './mission.repository.js';

describe('isMissionLocked', () => {
  it('unlocks every Mission for an admin without completion progress', () => {
    expect(isMissionLocked('ADMIN', 7, 'previous', null, new Set())).toBe(false);
  });

  it('keeps the first learner Mission open', () => {
    expect(isMissionLocked('USER', 1, null, null, new Set())).toBe(false);
  });

  it('requires the previous Mission for a learner', () => {
    expect(isMissionLocked('USER', 2, 'previous', null, new Set())).toBe(true);
    expect(isMissionLocked('USER', 2, 'previous', null, new Set(['previous']))).toBe(false);
  });

  it('requires the previous Chapter boss at a Chapter boundary', () => {
    expect(isMissionLocked('USER', 3, null, 'boss', new Set())).toBe(true);
    expect(isMissionLocked('USER', 3, null, 'boss', new Set(['boss']))).toBe(false);
  });
});

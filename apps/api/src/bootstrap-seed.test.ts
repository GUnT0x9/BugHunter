import { describe, expect, it } from 'vitest';
import { missions } from '@bughunter/content';
import { getBootstrapSeedPlan } from './bootstrap-seed.js';

describe('getBootstrapSeedPlan', () => {
  it('does not overwrite complete bootstrap data', () => {
    expect(getBootstrapSeedPlan(missions.length, 1)).toEqual({
      seedContent: false,
      seedAdmin: false,
    });
  });

  it('repairs incomplete content without overwriting an existing admin', () => {
    expect(getBootstrapSeedPlan(missions.length - 1, 1)).toEqual({
      seedContent: true,
      seedAdmin: false,
    });
  });

  it('creates a missing admin without overwriting complete content', () => {
    expect(getBootstrapSeedPlan(missions.length, 0)).toEqual({
      seedContent: false,
      seedAdmin: true,
    });
  });
});

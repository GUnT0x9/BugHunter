import { describe, expect, it } from 'vitest';
import { CreateDuelSchema, JoinDuelSchema } from './duel.schema.js';

describe('duel input schemas', () => {
  it('accepts a mission id', () => {
    expect(CreateDuelSchema.parse({ missionId: 'mission-1' })).toEqual({ missionId: 'mission-1' });
  });

  it('normalizes a six-character invite code', () => {
    expect(JoinDuelSchema.parse({ code: ' ab12ef ' })).toEqual({ code: 'AB12EF' });
  });

  it('rejects malformed invite codes', () => {
    expect(() => JoinDuelSchema.parse({ code: 'ABC' })).toThrow();
  });
});

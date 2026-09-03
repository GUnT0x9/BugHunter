import { describe, expect, it } from 'vitest';
import { CreateDuelSchema, JoinDuelSchema } from './duel.schema.js';

describe('duel input schemas', () => {
  it('accepts a difficulty level', () => {
    expect(CreateDuelSchema.parse({ difficulty: 3 })).toEqual({ difficulty: 3 });
  });

  it('rejects out-of-range difficulty', () => {
    expect(() => CreateDuelSchema.parse({ difficulty: 6 })).toThrow();
  });

  it('normalizes a six-character invite code', () => {
    expect(JoinDuelSchema.parse({ code: ' ab12ef ' })).toEqual({ code: 'AB12EF' });
  });

  it('rejects malformed invite codes', () => {
    expect(() => JoinDuelSchema.parse({ code: 'ABC' })).toThrow();
  });
});

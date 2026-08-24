import { describe, expect, it } from 'vitest';
import {
  LoginInputSchema,
  MissionCodeSchema,
  normalizeOutput,
  redactHiddenTests,
  RegisterInputSchema,
} from './index.js';

describe('contracts', () => {
  it('normalizes platform output without removing intentional line breaks', () => {
    expect(normalizeOutput('one\r\ntwo  \n')).toBe('one\ntwo');
  });

  it('removes hidden test values before a result is returned to a learner', () => {
    const [visible, hidden] = redactHiddenTests([
      {
        order: 1,
        passed: false,
        isHidden: false,
        input: '1',
        expectedOutput: '2',
        actualOutput: '1',
      },
      { order: 2, passed: false, isHidden: true, input: 'secret', expectedOutput: 'answer' },
    ]);
    expect(visible?.input).toBe('1');
    expect(hidden).toEqual({ order: 2, passed: false, isHidden: true });
  });

  it('normalizes email and nickname during registration validation', () => {
    expect(
      RegisterInputSchema.parse({
        email: '  HUNTER@EXAMPLE.COM ',
        username: ' 버그탐정 ',
        password: 'correct-password',
      }),
    ).toEqual({
      email: 'hunter@example.com',
      username: '버그탐정',
      password: 'correct-password',
    });
  });

  it('keeps login and registration fields separate', () => {
    expect(
      LoginInputSchema.safeParse({ email: 'hunter@example.com', password: 'short' }).success,
    ).toBe(false);
    expect(
      RegisterInputSchema.safeParse({
        email: 'hunter@example.com',
        username: 'not/allowed',
        password: 'correct-password',
      }).success,
    ).toBe(false);
  });

  it('rejects code containing a null character', () => {
    expect(MissionCodeSchema.safeParse({ code: 'print(1)\0' }).success).toBe(false);
  });
});

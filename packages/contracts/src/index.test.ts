import { describe, expect, it } from 'vitest';
import {
  LoginInputSchema,
  MissionCodeSchema,
  MAX_MISSION_RUN_INPUT_LENGTH,
  MissionRunSchema,
  ProfileUpdateSchema,
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

  it('uses the registration nickname rules for profile updates', () => {
    expect(ProfileUpdateSchema.parse({ username: ' 디버그 탐정 ' })).toEqual({
      username: '디버그 탐정',
    });
    expect(ProfileUpdateSchema.safeParse({ username: 'x' }).success).toBe(false);
    expect(ProfileUpdateSchema.safeParse({ username: 'not/allowed' }).success).toBe(false);
  });

  it('rejects code containing a null character', () => {
    expect(MissionCodeSchema.safeParse({ code: 'print(1)\0' }).success).toBe(false);
  });

  it.each(['', '첫째 줄\n둘째 줄\n', '한글 입력'])('accepts custom stdin: %j', (input) => {
    expect(MissionRunSchema.parse({ code: 'print(input())', input }).input).toBe(input);
  });

  it('rejects oversized custom stdin and null characters', () => {
    expect(
      MissionRunSchema.safeParse({
        code: 'pass',
        input: 'a'.repeat(MAX_MISSION_RUN_INPUT_LENGTH + 1),
      }).success,
    ).toBe(false);
    expect(MissionRunSchema.safeParse({ code: 'pass', input: 'hello\0world' }).success).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { validateMissionShape } from './admin-validation.js';

describe('Mission publish validator', () => {
  it('rejects incomplete content before it can be published', () => {
    expect(
      validateMissionShape({
        initialCode: '',
        referenceSolution: '',
        tests: [],
        hints: [],
        concepts: [],
      }),
    ).toEqual({
      ready: false,
      issues: expect.arrayContaining([
        '초기 버그 코드가 비어 있습니다.',
        'Test Case는 최소 3개가 필요합니다.',
      ]),
    });
  });

  it('accepts a complete Mission shape', () => {
    expect(
      validateMissionShape({
        initialCode: 'print(1)',
        referenceSolution: 'print(2)',
        tests: [
          { input: 'a', expectedOutput: 'b', isHidden: false },
          { input: 'c', expectedOutput: 'd', isHidden: false },
          { input: 'e', expectedOutput: 'f', isHidden: true },
        ],
        hints: ['a', 'b', 'c'],
        concepts: ['print'],
      }),
    ).toEqual({ ready: true, issues: [] });
  });
});

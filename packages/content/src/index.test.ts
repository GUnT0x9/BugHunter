import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { normalizeOutput } from '@bughunter/contracts';
import { missions, validateContentShape } from './index.js';

function runPython(code: string, input: string): { status: number | null; output: string } {
  const result = spawnSync('python3', ['-c', code], { encoding: 'utf8', input, timeout: 3_000 });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe('Mission content', () => {
  it('contains the planned 45 Mission curriculum with one Boss per Chapter', () => {
    expect(validateContentShape()).toEqual([]);
  });

  it.each(missions.map((mission) => [mission.slug, mission] as const))(
    '%s has a passing reference solution and a failing initial version',
    (_slug, mission) => {
      const referenceResults = mission.tests.map((test) => {
        const result = runPython(mission.referenceSolution, test.input);
        return (
          result.status === 0 &&
          normalizeOutput(result.output) === normalizeOutput(test.expectedOutput)
        );
      });
      const initialCache = new Map<string, boolean>();
      const initialFailsTest = (test: (typeof mission.tests)[number]): boolean => {
        const cached = initialCache.get(test.input);
        if (cached !== undefined) return cached;
        const result = runPython(mission.initialCode, test.input);
        const failed =
          result.status !== 0 ||
          normalizeOutput(result.output) !== normalizeOutput(test.expectedOutput);
        initialCache.set(test.input, failed);
        return failed;
      };
      const initialFails = mission.tests.some(initialFailsTest);
      const hiddenCatchesBug = mission.tests.filter((test) => test.isHidden).some(initialFailsTest);
      expect(referenceResults.every(Boolean)).toBe(true);
      expect(initialFails).toBe(true);
      expect(hiddenCatchesBug).toBe(true);
    },
    10_000,
  );
});

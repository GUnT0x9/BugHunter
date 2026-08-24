import type { TestCase } from '@bughunter/contracts';

export const triple = (inputs: string[], outputs: string[], hiddenLast = true): Omit<TestCase, 'id'>[] =>
  inputs.map((input, index) => ({
    order: index + 1,
    input,
    expectedOutput: outputs[index] ?? '',
    isHidden: hiddenLast && index === inputs.length - 1,
  }));

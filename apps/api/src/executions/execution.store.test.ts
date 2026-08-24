import { describe, expect, it } from 'vitest';
import { ExecutionStore } from './execution.store.js';

describe('ExecutionStore initial state', () => {
  it('starts a run with no output or test result', () => {
    expect(ExecutionStore.initial('run-1', 'RUN')).toMatchObject({
      id: 'run-1',
      status: 'QUEUED',
      diagnostic: null,
      completed: false,
      tests: [],
    });
  });
});

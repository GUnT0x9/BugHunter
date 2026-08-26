import { describe, expect, it, vi } from 'vitest';
import type { ExecutionStore } from './execution.store.js';
import type { JudgeProviderService } from './judge-provider.service.js';
import { QueueDispatcherService } from './queue-dispatcher.service.js';

function createDispatcher(judgeAvailable: boolean) {
  const executions = {
    recoverInterruptedExecutions: vi.fn().mockResolvedValue(0),
    findDispatchCandidates: vi.fn().mockResolvedValue([{ id: 'execution-1' }]),
    markEnqueued: vi.fn().mockResolvedValue({ count: 1 }),
  };
  const judgeProvider = {
    isAvailable: vi.fn().mockResolvedValue(judgeAvailable),
    dispatch: vi.fn().mockResolvedValue(undefined),
  };
  const dispatcher = new QueueDispatcherService(
    executions as unknown as ExecutionStore,
    judgeProvider as unknown as JudgeProviderService,
  );
  return { dispatcher, executions, judgeProvider };
}

describe('QueueDispatcherService', () => {
  it('recovers interrupted database work before dispatching it again', async () => {
    const { dispatcher, executions, judgeProvider } = createDispatcher(true);

    await dispatcher.dispatchPending();

    expect(executions.recoverInterruptedExecutions).toHaveBeenCalledOnce();
    expect(judgeProvider.dispatch).toHaveBeenCalledWith('execution-1');
    expect(executions.markEnqueued).toHaveBeenCalledWith('execution-1');
  });

  it('keeps persisted grading work queued while Judge0 is unavailable', async () => {
    const { dispatcher, executions, judgeProvider } = createDispatcher(false);

    await dispatcher.dispatchPending();

    expect(executions.recoverInterruptedExecutions).toHaveBeenCalledOnce();
    expect(executions.findDispatchCandidates).not.toHaveBeenCalled();
    expect(judgeProvider.dispatch).not.toHaveBeenCalled();
  });

  it('contains recovery failures instead of rejecting the Render process timer', async () => {
    const { dispatcher, executions, judgeProvider } = createDispatcher(true);
    executions.recoverInterruptedExecutions.mockRejectedValueOnce(new Error('database offline'));

    await expect(dispatcher.dispatchPending()).resolves.toBeUndefined();
    expect(judgeProvider.isAvailable).not.toHaveBeenCalled();
  });
});

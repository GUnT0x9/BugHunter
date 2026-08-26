import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../common/prisma.service.js';
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

  it('returns an interrupted RUNNING execution to the durable queue', async () => {
    const executionUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const submissionUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const transactionClient = {
      execution: { updateMany: executionUpdateMany },
      submission: { updateMany: submissionUpdateMany },
    };
    const prisma = {
      execution: {
        findMany: vi.fn().mockResolvedValue([{ id: 'run-1', submissionId: 'submission-1' }]),
      },
      $transaction: vi.fn((callback: (client: typeof transactionClient) => Promise<void>) =>
        callback(transactionClient),
      ),
    };
    const store = new ExecutionStore(prisma as unknown as PrismaService);

    await expect(
      store.recoverInterruptedExecutions(new Date('2026-08-26T00:01:00Z')),
    ).resolves.toBe(1);
    expect(executionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'run-1', status: 'RUNNING' }),
        data: expect.objectContaining({ status: 'QUEUED', enqueuedAt: null, startedAt: null }),
      }),
    );
    expect(submissionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'QUEUED' } }),
    );
  });

  it('does not reset a submission that another process already completed', async () => {
    const submissionUpdateMany = vi.fn();
    const transactionClient = {
      execution: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      submission: { updateMany: submissionUpdateMany },
    };
    const prisma = {
      execution: {
        findMany: vi.fn().mockResolvedValue([{ id: 'run-1', submissionId: 'submission-1' }]),
      },
      $transaction: vi.fn((callback: (client: typeof transactionClient) => Promise<void>) =>
        callback(transactionClient),
      ),
    };
    const store = new ExecutionStore(prisma as unknown as PrismaService);

    await expect(store.recoverInterruptedExecutions()).resolves.toBe(0);
    expect(submissionUpdateMany).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../common/prisma.service.js';
import type { Judge0Runner } from './judge0-runner.js';
import { RemoteExecutionService } from './remote-execution.service.js';

function executionRecord(attemptCount: number, kind: 'RUN' | 'SUBMIT' = 'RUN') {
  return {
    id: 'execution-1',
    userId: 'user-1',
    missionId: 'mission-1',
    submissionId: kind === 'SUBMIT' ? 'submission-1' : null,
    kind,
    status: 'RUNNING',
    code: 'print("BugHunter")',
    customInput: '사용자 입력\n',
    attemptCount,
    mission: {
      tests: [
        {
          sortOrder: 1,
          input: '',
          expectedOutput: 'BugHunter\n',
          isHidden: false,
        },
      ],
    },
  };
}

function createService(
  attemptCount: number,
  execute: ReturnType<typeof vi.fn>,
  kind: 'RUN' | 'SUBMIT' = 'RUN',
) {
  const loaded = executionRecord(attemptCount, kind);
  const execution = {
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    findUniqueOrThrow: vi
      .fn()
      .mockResolvedValueOnce(loaded)
      .mockResolvedValue({ status: 'RUNNING', attemptCount }),
    findUnique: vi.fn().mockResolvedValue(loaded),
    update: vi.fn().mockResolvedValue(loaded),
  };
  const submission = {
    update: vi.fn().mockResolvedValue(undefined),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
  };
  const prisma = {
    execution,
    submission,
    $transaction: vi.fn(
      (
        callback: (client: {
          execution: typeof execution;
          submission: typeof submission;
        }) => unknown,
      ) => callback({ execution, submission }),
    ),
  };
  const runner = { execute };
  return {
    service: new RemoteExecutionService(
      prisma as unknown as PrismaService,
      runner as unknown as Judge0Runner,
    ),
    execution,
    execute,
  };
}

describe('RemoteExecutionService', () => {
  it('persists a successful Judge0 result under the claimed lease', async () => {
    const { service, execution, execute } = createService(
      1,
      vi.fn().mockResolvedValue({
        stdout: 'BugHunter\n',
        stderr: '',
        exitCode: 0,
        executionTimeMs: 10,
        timedOut: false,
        outputLimited: false,
      }),
    );

    service.dispatch('execution-1');
    await service.onModuleDestroy();

    expect(execution.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'SUCCEEDED' }) }),
    );
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith('print("BugHunter")', '사용자 입력\n');
    expect(execution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resultJson: expect.objectContaining({ customInput: '사용자 입력\n', tests: [] }),
        }),
      }),
    );
  });

  it('runs every public and hidden test for SUBMIT', async () => {
    const execute = vi.fn().mockResolvedValue({
      stdout: 'wrong\n',
      stderr: '',
      exitCode: 0,
      executionTimeMs: 3,
      timedOut: false,
      outputLimited: false,
    });
    const { service, execution } = createService(1, execute, 'SUBMIT');
    const loaded = executionRecord(1, 'SUBMIT');
    loaded.mission.tests.push({
      sortOrder: 2,
      input: 'secret',
      expectedOutput: 'BugHunter\n',
      isHidden: true,
    });
    execution.findUniqueOrThrow
      .mockReset()
      .mockResolvedValueOnce(loaded)
      .mockResolvedValue({ status: 'RUNNING', attemptCount: 1 });

    service.dispatch('execution-1');
    await service.onModuleDestroy();

    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenNthCalledWith(2, 'print("BugHunter")', 'secret');
    expect(execution.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
  });

  it('returns an interrupted remote execution to QUEUED for another process attempt', async () => {
    const { service, execution } = createService(
      1,
      vi.fn().mockRejectedValue(new Error('Render shutdown')),
    );

    service.dispatch('execution-1');
    await service.onModuleDestroy();

    expect(execution.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'QUEUED',
          enqueuedAt: expect.any(Date),
          startedAt: null,
        }),
      }),
    );
  });

  it('finishes with an explicit ERROR after the retry budget is exhausted', async () => {
    const { service, execution } = createService(
      6,
      vi.fn().mockRejectedValue(new Error('Judge0 unavailable')),
    );

    service.dispatch('execution-1');
    await service.onModuleDestroy();

    expect(execution.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'ERROR' }) }),
    );
  });

  it('does not reset a newer lease when an older attempt finishes late', async () => {
    const { service, execution } = createService(
      1,
      vi.fn().mockRejectedValue(new Error('Old Judge0 request finished late')),
    );
    execution.findUnique.mockResolvedValue({ ...executionRecord(2), attemptCount: 2 });

    service.dispatch('execution-1');
    await service.onModuleDestroy();

    expect(execution.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'QUEUED' }) }),
    );
  });
});

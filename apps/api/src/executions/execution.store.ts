import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ExecutionKind as PrismaExecutionKind,
  ExecutionStatus as PrismaExecutionStatus,
  Prisma,
} from '@prisma/client';
import { redactHiddenTests, type ExecutionKind, type ExecutionResult } from '@bughunter/contracts';
import { PrismaService } from '../common/prisma.service.js';

const REDIS_REQUEUE_AFTER_MS = 5_000;
const QUEUE_EXPIRY_MS = 30_000;

export class ActiveExecutionError extends Error {
  constructor() {
    super('A user can have only one active execution.');
  }
}

function isActiveExecutionConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  const target = error.meta?.target;
  return Array.isArray(target) && target.includes('activeUserId');
}

function toExecutionResult(record: {
  id: string;
  kind: PrismaExecutionKind;
  status: PrismaExecutionStatus;
  resultJson: Prisma.JsonValue | null;
}): ExecutionResult {
  const result = (record.resultJson ?? {}) as Partial<ExecutionResult>;
  return {
    id: record.id,
    kind: record.kind,
    status: record.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.exitCode ?? null,
    executionTimeMs: result.executionTimeMs ?? null,
    errorKind: result.errorKind ?? 'NONE',
    diagnostic: result.diagnostic ?? null,
    tests: redactHiddenTests(result.tests ?? []),
    awardedXp: result.awardedXp ?? 0,
    completed: result.completed ?? false,
  };
}

@Injectable()
export class ExecutionStore {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    id: string;
    userId: string;
    missionId: string;
    code: string;
    kind: ExecutionKind;
  }): Promise<{ executionId: string; submissionId: string | null }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        let submissionId: string | null = null;
        if (input.kind === 'SUBMIT') {
          const submission = await tx.submission.create({
            data: { userId: input.userId, missionId: input.missionId, code: input.code },
          });
          submissionId = submission.id;
          await tx.missionProgress.upsert({
            where: { userId_missionId: { userId: input.userId, missionId: input.missionId } },
            create: {
              userId: input.userId,
              missionId: input.missionId,
              attempts: 1,
              lastCode: input.code,
            },
            update: { attempts: { increment: 1 }, lastCode: input.code },
          });
        }
        await tx.execution.create({
          data: {
            id: input.id,
            userId: input.userId,
            missionId: input.missionId,
            submissionId,
            kind: input.kind,
            code: input.code,
            activeUserId: input.userId,
          },
        });
        return { executionId: input.id, submissionId };
      });
    } catch (error: unknown) {
      if (isActiveExecutionConflict(error)) throw new ActiveExecutionError();
      throw error;
    }
  }

  async getForUser(id: string, userId: string): Promise<ExecutionResult> {
    const record = await this.prisma.execution.findUnique({ where: { id } });
    if (!record || record.userId !== userId) {
      throw new NotFoundException('실행 결과를 찾을 수 없습니다.');
    }
    return toExecutionResult(record);
  }

  findDispatchCandidates(limit = 20) {
    const staleBefore = new Date(Date.now() - REDIS_REQUEUE_AFTER_MS);
    return this.prisma.execution.findMany({
      where: {
        status: PrismaExecutionStatus.QUEUED,
        OR: [{ enqueuedAt: null }, { enqueuedAt: { lt: staleBefore } }],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true },
    });
  }

  markEnqueued(id: string) {
    return this.prisma.execution.updateMany({
      where: { id, status: PrismaExecutionStatus.QUEUED },
      data: { enqueuedAt: new Date() },
    });
  }

  async expireQueuedExecutions(): Promise<number> {
    const stale = await this.prisma.execution.findMany({
      where: {
        status: PrismaExecutionStatus.QUEUED,
        createdAt: { lt: new Date(Date.now() - QUEUE_EXPIRY_MS) },
      },
      select: { id: true, kind: true, submissionId: true },
    });
    let expiredCount = 0;
    for (const execution of stale) {
      await this.prisma.$transaction(async (tx) => {
        const result: ExecutionResult = {
          ...ExecutionStore.initial(execution.id, execution.kind),
          status: 'ERROR',
          errorKind: 'INTERNAL_ERROR',
          diagnostic: {
            kind: 'INTERNAL_ERROR',
            message: '채점 서버에 연결할 수 없습니다.',
            line: null,
            column: null,
          },
        };
        const updated = await tx.execution.updateMany({
          where: { id: execution.id, status: PrismaExecutionStatus.QUEUED },
          data: {
            status: PrismaExecutionStatus.ERROR,
            resultJson: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
            activeUserId: null,
            finishedAt: new Date(),
          },
        });
        if (updated.count === 0) return;
        expiredCount += 1;
        if (execution.submissionId) {
          await tx.submission.update({
            where: { id: execution.submissionId },
            data: { status: 'ERROR', resultJson: JSON.parse(JSON.stringify(result)) },
          });
        }
      });
    }
    return expiredCount;
  }

  static initial(id: string, kind: ExecutionKind): ExecutionResult {
    return {
      id,
      kind,
      status: 'QUEUED',
      stdout: '',
      stderr: '',
      exitCode: null,
      executionTimeMs: null,
      errorKind: 'NONE',
      diagnostic: null,
      tests: [],
      awardedXp: 0,
      completed: false,
    };
  }
}

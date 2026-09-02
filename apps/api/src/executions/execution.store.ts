import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ExecutionKind as PrismaExecutionKind,
  ExecutionStatus as PrismaExecutionStatus,
  Prisma,
  SubmissionStatus as PrismaSubmissionStatus,
} from '@prisma/client';
import { redactHiddenTests, type ExecutionKind, type ExecutionResult } from '@bughunter/contracts';
import { PrismaService } from '../common/prisma.service.js';

const REDIS_REQUEUE_AFTER_MS = 5_000;
const INTERRUPTED_EXECUTION_AFTER_MS = 45_000;

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
  customInput: string | null;
}): ExecutionResult {
  const result = (record.resultJson ?? {}) as Partial<ExecutionResult>;
  return {
    id: record.id,
    kind: record.kind,
    customInput: record.kind === PrismaExecutionKind.RUN ? record.customInput : null,
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
    rating: result.rating ?? null,
    mastered: result.mastered ?? false,
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
    customInput: string | null;
  }): Promise<{ executionId: string; submissionId: string | null }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        let submissionId: string | null = null;
        if (input.kind === 'SUBMIT') {
          const submission = await tx.submission.create({
            data: { userId: input.userId, missionId: input.missionId, code: input.code },
          });
          submissionId = submission.id;
          const existingProgress = await tx.missionProgress.findUnique({
            where: { userId_missionId: { userId: input.userId, missionId: input.missionId } },
            select: { completedAt: true },
          });
          if (!existingProgress?.completedAt) {
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
        }
        await tx.execution.create({
          data: {
            id: input.id,
            userId: input.userId,
            missionId: input.missionId,
            submissionId,
            kind: input.kind,
            code: input.code,
            customInput: input.kind === 'RUN' ? input.customInput : null,
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

  async recoverInterruptedExecutions(now = new Date()): Promise<number> {
    const stale = await this.prisma.execution.findMany({
      where: {
        status: PrismaExecutionStatus.RUNNING,
        updatedAt: { lt: new Date(now.getTime() - INTERRUPTED_EXECUTION_AFTER_MS) },
      },
      select: { id: true, submissionId: true },
    });
    let recoveredCount = 0;
    for (const execution of stale) {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.execution.updateMany({
          where: {
            id: execution.id,
            status: PrismaExecutionStatus.RUNNING,
            updatedAt: { lt: new Date(now.getTime() - INTERRUPTED_EXECUTION_AFTER_MS) },
          },
          data: {
            status: PrismaExecutionStatus.QUEUED,
            enqueuedAt: null,
            startedAt: null,
          },
        });
        if (updated.count === 0) return;
        recoveredCount += 1;
        if (execution.submissionId) {
          await tx.submission.updateMany({
            where: {
              id: execution.submissionId,
              status: PrismaSubmissionStatus.RUNNING,
            },
            data: { status: PrismaSubmissionStatus.QUEUED },
          });
        }
      });
    }
    return recoveredCount;
  }

  static initial(id: string, kind: ExecutionKind): ExecutionResult {
    return {
      id,
      kind,
      customInput: null,
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
      rating: null,
      mastered: false,
    };
  }
}

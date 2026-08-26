import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  normalizeOutput,
  type ExecutionErrorKind,
  type ExecutionResult,
} from '@bughunter/contracts';
import { ExecutionKind, ExecutionStatus, Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';
import { awardFirstCompletion } from './completion-award.js';
import { Judge0Runner, type RemoteRunResult } from './judge0-runner.js';
import { parsePythonDiagnostic, sanitizePythonStderr } from './python-diagnostic.js';

const MAX_REMOTE_EXECUTION_ATTEMPTS = 6;

type LoadedExecution = Prisma.ExecutionGetPayload<{
  include: { mission: { include: { tests: { orderBy: { sortOrder: 'asc' } } } } };
}>;

type ExecutionOutcome = {
  result: ExecutionResult;
  status: ExecutionStatus;
  executionTimeMs: number;
};

function classifyRun(run: RemoteRunResult): ExecutionErrorKind {
  if (run.timedOut) return 'TIMEOUT';
  if (run.outputLimited) return 'OUTPUT_LIMIT';
  if (run.exitCode === 0) return 'NONE';
  return /SyntaxError:/.test(run.stderr) ? 'SYNTAX_ERROR' : 'RUNTIME_ERROR';
}

function executionStatus(errorKind: ExecutionErrorKind, allPassed: boolean): ExecutionStatus {
  if (errorKind === 'TIMEOUT') return ExecutionStatus.TIMED_OUT;
  if (errorKind !== 'NONE') return ExecutionStatus.ERROR;
  return allPassed ? ExecutionStatus.SUCCEEDED : ExecutionStatus.FAILED;
}

function submissionStatus(status: ExecutionStatus): SubmissionStatus {
  if (status === ExecutionStatus.SUCCEEDED) return SubmissionStatus.PASSED;
  if (status === ExecutionStatus.FAILED) return SubmissionStatus.FAILED;
  if (status === ExecutionStatus.TIMED_OUT) return SubmissionStatus.TIMED_OUT;
  return SubmissionStatus.ERROR;
}

function jsonValue(result: ExecutionResult): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
}

@Injectable()
export class RemoteExecutionService implements OnModuleDestroy {
  private readonly logger = new Logger(RemoteExecutionService.name);
  private readonly activeTasks = new Set<Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: Judge0Runner,
  ) {}

  dispatch(executionId: string): void {
    const task = this.process(executionId).catch((error: unknown) => {
      this.logger.error(
        `Remote execution dispatch failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    });
    this.activeTasks.add(task);
    void task.finally(() => this.activeTasks.delete(task));
  }

  private async process(executionId: string): Promise<void> {
    const execution = await this.claimExecution(executionId);
    if (!execution) return;
    try {
      const outcome = await this.executeTests(execution);
      await this.persistOutcome(execution, outcome);
    } catch (error: unknown) {
      await this.handleProcessFailure(executionId, execution.attemptCount, error);
    }
  }

  private async claimExecution(executionId: string): Promise<LoadedExecution | null> {
    const claimed = await this.prisma.execution.updateMany({
      where: {
        id: executionId,
        status: ExecutionStatus.QUEUED,
        attemptCount: { lt: MAX_REMOTE_EXECUTION_ATTEMPTS },
      },
      data: {
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
    if (claimed.count === 0) {
      const current = await this.prisma.execution.findUnique({
        where: { id: executionId },
        select: { status: true, attemptCount: true },
      });
      if (
        current?.status === ExecutionStatus.QUEUED &&
        current.attemptCount >= MAX_REMOTE_EXECUTION_ATTEMPTS
      ) {
        await this.failExecution(
          executionId,
          ExecutionStatus.QUEUED,
          current.attemptCount,
        );
      }
      return null;
    }
    const execution = await this.prisma.execution.findUniqueOrThrow({
      where: { id: executionId },
      include: { mission: { include: { tests: { orderBy: { sortOrder: 'asc' } } } } },
    });
    if (execution.submissionId) {
      await this.prisma.submission.update({
        where: { id: execution.submissionId },
        data: { status: SubmissionStatus.RUNNING },
      });
    }
    return execution;
  }

  private async executeTests(execution: LoadedExecution): Promise<ExecutionOutcome> {
    const selectedTests = execution.mission.tests.filter(
      (test) => execution.kind === ExecutionKind.SUBMIT || !test.isHidden,
    );
    let errorKind: ExecutionErrorKind = selectedTests.length === 0 ? 'INTERNAL_ERROR' : 'NONE';
    let stdout = '';
    let stderr = '';
    let exitCode: number | null = null;
    let executionTimeMs = 0;
    const tests: ExecutionResult['tests'] = [];

    for (const test of selectedTests) {
      await this.touchExecution(execution.id, execution.attemptCount);
      const run = await this.runner.execute(execution.code, test.input);
      await this.touchExecution(execution.id, execution.attemptCount);
      executionTimeMs += run.executionTimeMs;
      stdout = run.stdout;
      stderr = sanitizePythonStderr(run.stderr);
      exitCode = run.exitCode;
      errorKind = classifyRun(run);
      tests.push({
        order: test.sortOrder,
        passed:
          errorKind === 'NONE' &&
          normalizeOutput(run.stdout) === normalizeOutput(test.expectedOutput),
        input: test.input,
        expectedOutput: test.expectedOutput,
        actualOutput: run.stdout,
        isHidden: test.isHidden,
      });
      if (errorKind !== 'NONE') break;
    }

    const status = executionStatus(
      errorKind,
      tests.length > 0 && tests.every((test) => test.passed),
    );
    const baseResult: ExecutionResult = {
      id: execution.id,
      kind: execution.kind,
      status,
      stdout,
      stderr,
      exitCode,
      executionTimeMs,
      errorKind,
      diagnostic: parsePythonDiagnostic(errorKind, stderr),
      tests,
      awardedXp: 0,
      completed: false,
    };
    return { result: baseResult, status, executionTimeMs };
  }

  private async persistOutcome(
    execution: LoadedExecution,
    outcome: ExecutionOutcome,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.execution.findUniqueOrThrow({ where: { id: execution.id } });
      if (
        current.status !== ExecutionStatus.RUNNING ||
        current.attemptCount !== execution.attemptCount
      ) {
        return;
      }
      const award =
        execution.kind === ExecutionKind.SUBMIT && outcome.status === ExecutionStatus.SUCCEEDED
          ? await awardFirstCompletion(tx, execution.userId, execution.missionId)
          : { awardedXp: 0, completed: false };
      const result = { ...outcome.result, ...award };
      await tx.execution.update({
        where: { id: execution.id },
        data: {
          status: outcome.status,
          resultJson: jsonValue(result),
          activeUserId: null,
          finishedAt: new Date(),
        },
      });
      if (execution.submissionId) {
        await tx.submission.update({
          where: { id: execution.submissionId },
          data: {
            status: submissionStatus(outcome.status),
            executionTimeMs: outcome.executionTimeMs,
            resultJson: jsonValue(result),
          },
        });
      }
    });
  }

  private async touchExecution(executionId: string, attemptCount: number): Promise<void> {
    const touched = await this.prisma.execution.updateMany({
      where: { id: executionId, status: ExecutionStatus.RUNNING, attemptCount },
      data: { updatedAt: new Date() },
    });
    if (touched.count === 0) throw new Error(`Remote execution lease lost: ${executionId}`);
  }

  private async handleProcessFailure(
    executionId: string,
    attemptCount: number,
    error: unknown,
  ): Promise<void> {
    this.logger.warn(
      `Remote execution interrupted: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
    try {
      await this.retryOrFailExecution(executionId, attemptCount);
    } catch (recoveryError: unknown) {
      this.logger.error(
        `Remote execution recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'unknown error'}`,
      );
    }
  }

  private async retryOrFailExecution(executionId: string, attemptCount: number): Promise<void> {
    const execution = await this.prisma.execution.findUnique({ where: { id: executionId } });
    if (
      !execution ||
      execution.status !== ExecutionStatus.RUNNING ||
      execution.attemptCount !== attemptCount
    ) {
      return;
    }
    if (execution.attemptCount >= MAX_REMOTE_EXECUTION_ATTEMPTS) {
      await this.failExecution(executionId, ExecutionStatus.RUNNING, attemptCount);
      return;
    }
    await this.prisma.$transaction(async (tx) => {
      const reset = await tx.execution.updateMany({
        where: {
          id: execution.id,
          status: ExecutionStatus.RUNNING,
          attemptCount: execution.attemptCount,
        },
        data: {
          status: ExecutionStatus.QUEUED,
          enqueuedAt: new Date(),
          startedAt: null,
        },
      });
      if (reset.count === 0 || !execution.submissionId) return;
      await tx.submission.updateMany({
        where: { id: execution.submissionId, status: SubmissionStatus.RUNNING },
        data: { status: SubmissionStatus.QUEUED },
      });
    });
  }

  private async failExecution(
    executionId: string,
    expectedStatus: ExecutionStatus,
    expectedAttemptCount: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const execution = await tx.execution.findUnique({ where: { id: executionId } });
      if (
        !execution ||
        execution.status !== expectedStatus ||
        execution.attemptCount !== expectedAttemptCount
      ) {
        return;
      }
      const result: ExecutionResult = {
        id: execution.id,
        kind: execution.kind,
        status: 'ERROR',
        stdout: '',
        stderr: '',
        exitCode: null,
        executionTimeMs: null,
        errorKind: 'INTERNAL_ERROR',
        diagnostic: parsePythonDiagnostic('INTERNAL_ERROR', ''),
        tests: [],
        awardedXp: 0,
        completed: false,
      };
      const updated = await tx.execution.updateMany({
        where: {
          id: execution.id,
          status: expectedStatus,
          attemptCount: expectedAttemptCount,
        },
        data: {
          status: ExecutionStatus.ERROR,
          resultJson: jsonValue(result),
          activeUserId: null,
          finishedAt: new Date(),
        },
      });
      if (updated.count === 0 || !execution.submissionId) return;
      await tx.submission.updateMany({
        where: { id: execution.submissionId },
        data: { status: SubmissionStatus.ERROR, resultJson: jsonValue(result) },
      });
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled(this.activeTasks);
  }
}

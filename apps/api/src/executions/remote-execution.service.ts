import { Injectable, Logger } from '@nestjs/common';
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
export class RemoteExecutionService {
  private readonly logger = new Logger(RemoteExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: Judge0Runner,
  ) {}

  dispatch(executionId: string): void {
    void this.process(executionId).catch(async (error: unknown) => {
      this.logger.error(
        `Remote execution failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      await this.failExecution(executionId);
    });
  }

  private async process(executionId: string): Promise<void> {
    const claimed = await this.prisma.execution.updateMany({
      where: { id: executionId, status: ExecutionStatus.QUEUED },
      data: {
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
    if (claimed.count === 0) return;
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
      const run = await this.runner.execute(execution.code, test.input);
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

    await this.prisma.$transaction(async (tx) => {
      const award =
        execution.kind === ExecutionKind.SUBMIT && status === ExecutionStatus.SUCCEEDED
          ? await awardFirstCompletion(tx, execution.userId, execution.missionId)
          : { awardedXp: 0, completed: false };
      const result = { ...baseResult, ...award };
      await tx.execution.update({
        where: { id: execution.id },
        data: {
          status,
          resultJson: jsonValue(result),
          activeUserId: null,
          finishedAt: new Date(),
        },
      });
      if (execution.submissionId) {
        await tx.submission.update({
          where: { id: execution.submissionId },
          data: {
            status: submissionStatus(status),
            executionTimeMs,
            resultJson: jsonValue(result),
          },
        });
      }
    });
  }

  private async failExecution(executionId: string): Promise<void> {
    const execution = await this.prisma.execution.findUnique({ where: { id: executionId } });
    if (
      !execution ||
      (execution.status !== ExecutionStatus.QUEUED && execution.status !== ExecutionStatus.RUNNING)
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
    await this.prisma.$transaction([
      this.prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.ERROR,
          resultJson: jsonValue(result),
          activeUserId: null,
          finishedAt: new Date(),
        },
      }),
      ...(execution.submissionId
        ? [
            this.prisma.submission.update({
              where: { id: execution.submissionId },
              data: { status: SubmissionStatus.ERROR, resultJson: jsonValue(result) },
            }),
          ]
        : []),
    ]);
  }
}

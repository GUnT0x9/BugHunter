import {
  normalizeOutput,
  type ExecutionErrorKind,
  type ExecutionResult,
} from '@bughunter/contracts';
import {
  ExecutionKind,
  ExecutionStatus,
  Prisma,
  PrismaClient,
  SubmissionStatus,
} from '@prisma/client';
import { Job, Worker } from 'bullmq';
import Docker from 'dockerode';
import { Redis } from 'ioredis';
import { DockerRunner, type DockerRunResult } from './docker-runner.js';
import { loadWorkerEnv } from './env.js';
import { parsePythonDiagnostic, sanitizePythonStderr } from './python-diagnostic.js';
import { awardFirstCompletion } from './progress-award.js';

const JUDGE_QUEUE_NAME = 'judge-executions';
const MISSION_VALIDATION_QUEUE_NAME = 'judge-mission-validations';
const TERMINAL_STATUSES: ReadonlySet<ExecutionStatus> = new Set([
  ExecutionStatus.SUCCEEDED,
  ExecutionStatus.FAILED,
  ExecutionStatus.ERROR,
  ExecutionStatus.TIMED_OUT,
]);

type JudgeJobData = { executionId: string };
type MissionValidationJobData = { missionId: string };
type MissionValidationReport = { ready: boolean; issues: string[] };

const env = loadWorkerEnv();
const prisma = new PrismaClient();
const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const docker = new Docker();
const runner = new DockerRunner(docker, env.JUDGE_IMAGE);

function classifyRun(run: DockerRunResult): ExecutionErrorKind {
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

async function processExecution(job: Job<JudgeJobData>): Promise<void> {
  const execution = await prisma.execution.findUnique({
    where: { id: job.data.executionId },
    include: { mission: { include: { tests: { orderBy: { sortOrder: 'asc' } } } } },
  });
  if (!execution || TERMINAL_STATUSES.has(execution.status)) return;

  await prisma.$transaction([
    prisma.execution.update({
      where: { id: execution.id },
      data: {
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    }),
    ...(execution.submissionId
      ? [
          prisma.submission.update({
            where: { id: execution.submissionId },
            data: { status: SubmissionStatus.RUNNING },
          }),
        ]
      : []),
  ]);

  const selectedTests = execution.mission.tests.filter(
    (test) => execution.kind === ExecutionKind.SUBMIT || !test.isHidden,
  );
  let errorKind: ExecutionErrorKind = 'NONE';
  let stdout = '';
  let stderr = '';
  let exitCode: number | null = null;
  let totalExecutionTimeMs = 0;
  const tests: ExecutionResult['tests'] = [];

  if (selectedTests.length === 0) errorKind = 'INTERNAL_ERROR';
  for (const test of selectedTests) {
    const run = await runner.execute(execution.code, test.input);
    totalExecutionTimeMs += run.executionTimeMs;
    stdout = run.stdout;
    stderr = sanitizePythonStderr(run.stderr);
    exitCode = run.exitCode;
    errorKind = classifyRun(run);
    const passed =
      errorKind === 'NONE' && normalizeOutput(run.stdout) === normalizeOutput(test.expectedOutput);
    tests.push({
      order: test.sortOrder,
      passed,
      input: test.input,
      expectedOutput: test.expectedOutput,
      actualOutput: run.stdout,
      isHidden: test.isHidden,
    });
    if (errorKind !== 'NONE') break;
  }

  const allPassed = tests.length > 0 && tests.every((test) => test.passed);
  const status = executionStatus(errorKind, allPassed);
  const baseResult: ExecutionResult = {
    id: execution.id,
    kind: execution.kind,
    status,
    stdout,
    stderr,
    exitCode,
    executionTimeMs: totalExecutionTimeMs,
    errorKind,
    diagnostic: parsePythonDiagnostic(errorKind, stderr),
    tests,
    awardedXp: 0,
    completed: false,
  };

  await prisma.$transaction(async (tx) => {
    const current = await tx.execution.findUniqueOrThrow({ where: { id: execution.id } });
    if (TERMINAL_STATUSES.has(current.status)) return;
    const award =
      execution.kind === ExecutionKind.SUBMIT && status === ExecutionStatus.SUCCEEDED
        ? await awardFirstCompletion(tx, execution.userId, execution.missionId)
        : { awardedXp: 0, completed: false };
    const result = { ...baseResult, ...award };
    const storedResult = jsonValue(result);
    await tx.execution.update({
      where: { id: execution.id },
      data: {
        status,
        resultJson: storedResult,
        activeUserId: null,
        finishedAt: new Date(),
      },
    });
    if (execution.submissionId) {
      await tx.submission.update({
        where: { id: execution.submissionId },
        data: {
          status: submissionStatus(status),
          executionTimeMs: totalExecutionTimeMs,
          resultJson: storedResult,
        },
      });
    }
  });
}

async function processMissionValidation(
  job: Job<MissionValidationJobData>,
): Promise<MissionValidationReport> {
  const mission = await prisma.mission.findUnique({
    where: { id: job.data.missionId },
    include: { tests: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!mission) return { ready: false, issues: ['Mission을 찾을 수 없습니다.'] };
  if (mission.tests.length === 0) return { ready: false, issues: ['Test Case가 없습니다.'] };

  let initialCodeFails = false;
  for (const test of mission.tests) {
    const result = await runner.execute(mission.initialCode, test.input);
    if (
      result.exitCode !== 0 ||
      result.timedOut ||
      result.outputLimited ||
      normalizeOutput(result.stdout) !== normalizeOutput(test.expectedOutput)
    ) {
      initialCodeFails = true;
      break;
    }
  }

  const issues: string[] = [];
  if (!initialCodeFails) issues.push('초기 코드가 최소 1개 Test Case에서 실패해야 합니다.');
  for (const test of mission.tests) {
    const result = await runner.execute(mission.referenceSolution, test.input);
    const passed =
      result.exitCode === 0 &&
      !result.timedOut &&
      !result.outputLimited &&
      normalizeOutput(result.stdout) === normalizeOutput(test.expectedOutput);
    if (!passed) issues.push(`Reference solution이 Test ${test.sortOrder}에서 실패했습니다.`);
  }
  return { ready: issues.length === 0, issues };
}

function internalErrorResult(executionId: string, kind: ExecutionKind): ExecutionResult {
  return {
    id: executionId,
    kind,
    status: ExecutionStatus.ERROR,
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
}

await Promise.all([prisma.$connect(), redis.ping(), docker.ping()]);

const worker = new Worker<JudgeJobData>(JUDGE_QUEUE_NAME, processExecution, {
  connection: redis,
  concurrency: 2,
});
const validationWorker = new Worker<MissionValidationJobData, MissionValidationReport>(
  MISSION_VALIDATION_QUEUE_NAME,
  processMissionValidation,
  { connection: redis, concurrency: 1 },
);

worker.on('failed', (job) => {
  if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;
  void prisma.$transaction(async (tx) => {
    const execution = await tx.execution.findUnique({ where: { id: job.data.executionId } });
    if (!execution || TERMINAL_STATUSES.has(execution.status)) return;
    const result = internalErrorResult(execution.id, execution.kind);
    const storedResult = jsonValue(result);
    await tx.execution.update({
      where: { id: execution.id },
      data: {
        status: ExecutionStatus.ERROR,
        resultJson: storedResult,
        activeUserId: null,
        finishedAt: new Date(),
      },
    });
    if (execution.submissionId) {
      await tx.submission.update({
        where: { id: execution.submissionId },
        data: { status: SubmissionStatus.ERROR, resultJson: storedResult },
      });
    }
  });
});

async function shutdown(): Promise<void> {
  await validationWorker.close();
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

import { Injectable } from '@nestjs/common';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import {
  redactHiddenTests,
  type ExecutionResult,
  type SubmissionResult,
} from '@bughunter/contracts';
import { PrismaService } from '../common/prisma.service.js';

@Injectable()
export class SubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, missionId: string, code: string) {
    const [submission] = await this.prisma.$transaction([
      this.prisma.submission.create({ data: { userId, missionId, code } }),
      this.prisma.missionProgress.upsert({
        where: { userId_missionId: { userId, missionId } },
        create: { userId, missionId, attempts: 1, lastCode: code },
        update: { attempts: { increment: 1 }, lastCode: code },
      }),
    ]);
    return submission;
  }

  updateStatus(
    id: string,
    status: SubmissionStatus,
    executionTimeMs: number | null,
    resultJson: object,
  ) {
    return this.prisma.submission.update({
      data: { status, executionTimeMs, resultJson },
      where: { id },
    });
  }

  async getForUser(id: string, userId: string): Promise<SubmissionResult> {
    const submission = await this.prisma.submission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException('Submission을 찾을 수 없습니다.');
    if (submission.userId !== userId)
      throw new ForbiddenException('다른 사용자의 Submission은 볼 수 없습니다.');
    const result = submission.resultJson as Partial<ExecutionResult> | null;
    return {
      id: submission.id,
      status: submission.status,
      stdout: result?.stdout ?? '',
      stderr: result?.stderr ?? '',
      executionTimeMs: submission.executionTimeMs,
      errorKind:
        result?.errorKind ??
        (submission.status === SubmissionStatus.ERROR
          ? 'INTERNAL_ERROR'
          : submission.status === SubmissionStatus.TIMED_OUT
            ? 'TIMEOUT'
            : 'NONE'),
      diagnostic: result?.diagnostic ?? null,
      tests: redactHiddenTests(result?.tests ?? []),
      awardedXp: result?.awardedXp ?? 0,
      completed: result?.completed ?? false,
    };
  }
}

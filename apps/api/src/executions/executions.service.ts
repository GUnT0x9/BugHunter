import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ExecutionResult, MissionCode, User } from '@bughunter/contracts';
import { MissionRepository } from '../missions/mission.repository.js';
import { ActiveExecutionError, ExecutionStore } from './execution.store.js';
import { JudgeQueueService } from './judge-queue.service.js';
import { QueueDispatcherService } from './queue-dispatcher.service.js';

@Injectable()
export class ExecutionsService {
  constructor(
    private readonly missions: MissionRepository,
    private readonly executions: ExecutionStore,
    private readonly dispatcher: QueueDispatcherService,
    private readonly queue: JudgeQueueService,
  ) {}

  enqueueRun(user: User, missionId: string, input: MissionCode): Promise<{ executionId: string }> {
    return this.enqueue(user, missionId, input.code, 'RUN');
  }

  async enqueueSubmission(
    user: User,
    missionId: string,
    input: MissionCode,
  ): Promise<{ executionId: string; submissionId: string }> {
    const result = await this.enqueue(user, missionId, input.code, 'SUBMIT');
    if (!('submissionId' in result)) throw new Error('Submission ID is missing');
    return result;
  }

  getForUser(executionId: string, userId: string): Promise<ExecutionResult> {
    return this.executions.getForUser(executionId, userId);
  }

  private async enqueue(
    user: User,
    missionId: string,
    code: string,
    kind: 'RUN' | 'SUBMIT',
  ): Promise<{ executionId: string } | { executionId: string; submissionId: string }> {
    if (!(await this.queue.hasAvailableWorker())) {
      throw new ServiceUnavailableException(
        '채점 서버가 준비되지 않았습니다. Redis, Docker, Judge Worker 상태를 확인해주세요.',
      );
    }
    const mission = await this.missions.getPublic(missionId, user);
    if (mission.isLocked) throw new ForbiddenException('이전 Mission을 먼저 완료하세요.');
    const executionId = randomUUID();
    try {
      const created = await this.executions.create({
        id: executionId,
        userId: user.id,
        missionId,
        code,
        kind,
      });
      void this.dispatcher.dispatchOne(executionId);
      return created.submissionId
        ? { executionId, submissionId: created.submissionId }
        : { executionId };
    } catch (error: unknown) {
      if (error instanceof ActiveExecutionError) {
        throw new HttpException(
          '이전 코드 실행이 끝난 뒤 다시 시도하세요.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw error;
    }
  }
}

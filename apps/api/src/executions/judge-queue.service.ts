import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../common/redis.service.js';
import { JUDGE_QUEUE_NAME, type JudgeJobData } from './judge.types.js';

@Injectable()
export class JudgeQueueService implements OnModuleDestroy {
  private readonly queue: Queue<JudgeJobData>;

  constructor(redis: RedisService) {
    this.queue = new Queue<JudgeJobData>(JUDGE_QUEUE_NAME, { connection: redis.getClient() });
  }

  async enqueue(executionId: string): Promise<void> {
    const data: JudgeJobData = { executionId };
    await this.queue.add('execute', data, {
      jobId: executionId,
      attempts: 2,
      backoff: { type: 'exponential', delay: 500 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async hasAvailableWorker(): Promise<boolean> {
    try {
      return (await this.queue.getWorkersCount()) > 0;
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}

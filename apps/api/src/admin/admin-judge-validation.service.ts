import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import { randomUUID } from 'node:crypto';
import type { Redis } from 'ioredis';
import { RedisService } from '../common/redis.service.js';
import type { MissionValidationReport } from './admin-validation.js';

export const MISSION_VALIDATION_QUEUE_NAME = 'judge-mission-validations';
export type MissionValidationJobData = { missionId: string };

@Injectable()
export class AdminJudgeValidationService implements OnModuleDestroy {
  private readonly logger = new Logger(AdminJudgeValidationService.name);
  private queue: Queue<MissionValidationJobData, MissionValidationReport> | null = null;
  private events: QueueEvents | null = null;
  private eventsConnection: Redis | null = null;

  constructor(private readonly redis: RedisService) {}

  async validate(missionId: string): Promise<MissionValidationReport> {
    this.ensureQueue();
    const job = await this.queue!.add(
      'validate-mission',
      { missionId },
      { jobId: randomUUID(), removeOnComplete: 100, removeOnFail: 100 },
    );
    return job.waitUntilFinished(this.events!, 60_000);
  }

  async onModuleDestroy(): Promise<void> {
    await this.events?.close();
    await this.queue?.close();
    this.eventsConnection?.disconnect();
  }

  private ensureQueue(): void {
    if (this.queue && this.events) return;
    const connection = this.redis.getClient();
    this.eventsConnection = connection.duplicate({ maxRetriesPerRequest: null });
    this.queue = new Queue<MissionValidationJobData, MissionValidationReport>(
      MISSION_VALIDATION_QUEUE_NAME,
      { connection },
    );
    this.events = new QueueEvents(MISSION_VALIDATION_QUEUE_NAME, {
      connection: this.eventsConnection,
    });
    this.queue.on('error', (error) =>
      this.logger.warn(`Mission validation queue error: ${error.message}`),
    );
    this.events.on('error', (error) =>
      this.logger.warn(`Mission validation event error: ${error.message}`),
    );
  }
}

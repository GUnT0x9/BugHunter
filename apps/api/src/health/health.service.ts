import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';
import { RedisService } from '../common/redis.service.js';
import { JudgeQueueService } from '../executions/judge-queue.service.js';

type DependencyStatus = 'up' | 'down';
type InfrastructureStatus = {
  database: DependencyStatus;
  redis: DependencyStatus;
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queue: JudgeQueueService,
  ) {}

  async status() {
    const services = await this.checkInfrastructure();
    return this.requireHealthy(services);
  }

  async readiness() {
    const [services, workerAvailable] = await Promise.all([
      this.checkInfrastructure(),
      this.queue.hasAvailableWorker(),
    ]);
    return this.requireHealthy({
      ...services,
      judgeWorker: workerAvailable ? 'up' : 'down',
    });
  }

  private async checkInfrastructure(): Promise<InfrastructureStatus> {
    const [database, redis] = await Promise.allSettled([
      this.prisma.$queryRaw(Prisma.sql`SELECT 1`),
      this.redis.getClient().ping(),
    ]);
    return {
      database: database.status === 'fulfilled' ? 'up' : 'down',
      redis: redis.status === 'fulfilled' ? 'up' : 'down',
    };
  }

  private requireHealthy<T extends Record<string, DependencyStatus>>(services: T) {
    const result = { ok: Object.values(services).every((status) => status === 'up'), services };
    if (!result.ok) throw new ServiceUnavailableException(result);
    return result;
  }
}

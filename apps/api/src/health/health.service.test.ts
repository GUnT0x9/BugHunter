import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../common/prisma.service.js';
import type { RedisService } from '../common/redis.service.js';
import type { JudgeProviderService } from '../executions/judge-provider.service.js';
import { HealthService } from './health.service.js';

function createHealthService(input?: { databaseFails?: boolean; workerAvailable?: boolean }) {
  const databaseResult = input?.databaseFails
    ? vi.fn().mockRejectedValue(new Error('database unavailable'))
    : vi.fn().mockResolvedValue([{ result: 1 }]);
  const prisma = { $queryRaw: databaseResult } as unknown as PrismaService;
  const redis = {
    getClient: () => ({ ping: vi.fn().mockResolvedValue('PONG') }),
  } as unknown as RedisService;
  const judgeProvider = {
    isAvailable: vi.fn().mockResolvedValue(input?.workerAvailable ?? true),
  } as unknown as JudgeProviderService;
  return new HealthService(prisma, redis, judgeProvider);
}

describe('HealthService', () => {
  it('reports infrastructure and Judge Worker readiness', async () => {
    await expect(createHealthService().readiness()).resolves.toEqual({
      ok: true,
      services: { database: 'up', redis: 'up', judge: 'up' },
    });
  });

  it('returns an unavailable error when a required dependency is down', async () => {
    await expect(createHealthService({ databaseFails: true }).status()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(
      createHealthService({ workerAvailable: false }).readiness(),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

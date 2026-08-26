import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { loadEnv } from './env.js';

const REDIS_ERROR_LOG_INTERVAL_MS = 30_000;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private lastErrorLogAt = 0;
  private readonly client = new Redis(loadEnv().REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 2_000,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });

  constructor() {
    this.client.on('error', (error) => {
      const now = Date.now();
      if (now - this.lastErrorLogAt < REDIS_ERROR_LOG_INTERVAL_MS) return;
      this.lastErrorLogAt = now;
      this.logger.warn(`Redis connection error: ${error.message}`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }
}

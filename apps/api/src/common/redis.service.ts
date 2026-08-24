import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { loadEnv } from './env.js';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client = new Redis(loadEnv().REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 2_000,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }
}

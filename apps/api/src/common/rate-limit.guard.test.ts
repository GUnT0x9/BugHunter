import { ExecutionContext, HttpException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { RateLimitGuard } from './rate-limit.guard.js';

function context(path: string, method = 'GET'): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ path, method, ip: '127.0.0.1', socket: {} }),
    }),
  } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
  it('allows normal requests without Redis', async () => {
    const guard = new RateLimitGuard();

    await expect(guard.canActivate(context('/api/missions'))).resolves.toBe(true);
  });

  it('never rate limits Render liveness and readiness probes', async () => {
    const guard = new RateLimitGuard();

    for (let requestCount = 0; requestCount < 150; requestCount += 1) {
      await expect(guard.canActivate(context('/api/health/live'))).resolves.toBe(true);
      await expect(guard.canActivate(context('/api/health/ready'))).resolves.toBe(true);
    }
  });

  it('limits repeated authentication attempts', async () => {
    const guard = new RateLimitGuard();
    const login = context('/api/auth/login', 'POST');

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(guard.canActivate(login)).resolves.toBe(true);
    }
    await expect(guard.canActivate(login)).rejects.toBeInstanceOf(HttpException);
  });
});

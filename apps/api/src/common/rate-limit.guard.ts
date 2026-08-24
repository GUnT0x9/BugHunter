import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 120;
const MAX_AUTH_REQUESTS_PER_WINDOW = 10;

type RateLimitEntry = { count: number; expiresAt: number };

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.endsWith('/health')) return true;
    const clientId = request.ip || request.socket.remoteAddress || 'unknown';
    const isAuthRequest =
      request.method === 'POST' &&
      (request.path.endsWith('/auth/login') || request.path.endsWith('/auth/register'));
    const scope = isAuthRequest ? 'auth' : 'general';
    const limit = isAuthRequest ? MAX_AUTH_REQUESTS_PER_WINDOW : MAX_REQUESTS_PER_WINDOW;
    const now = Date.now();
    const key = `${scope}:${clientId}`;
    const current = this.entries.get(key);
    const entry =
      !current || current.expiresAt <= now
        ? { count: 1, expiresAt: now + WINDOW_SECONDS * 1_000 }
        : { ...current, count: current.count + 1 };
    this.entries.set(key, entry);
    if (entry.count > limit) {
      throw new HttpException(
        '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from './session.service.js';
import { SESSION_COOKIE_NAME } from './session.constants.js';
import type { RequestWithUser } from './current-user.decorator.js';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const sessionId = (request as Request & { cookies?: Record<string, string> }).cookies?.[
      SESSION_COOKIE_NAME
    ];
    const user = await this.sessions.get(sessionId);
    if (!user) throw new UnauthorizedException('로그인이 필요합니다.');
    request.currentUser = user;
    return true;
  }
}

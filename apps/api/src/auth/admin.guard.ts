import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { RequestWithUser } from './current-user.decorator.js';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.currentUser?.role !== 'ADMIN')
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    return true;
  }
}

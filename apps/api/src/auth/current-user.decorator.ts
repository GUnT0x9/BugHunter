import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from '@bughunter/contracts';
import type { Request } from 'express';

export type RequestWithUser = Request & { currentUser?: User };

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.currentUser) throw new Error('CurrentUser used without SessionAuthGuard');
    return request.currentUser;
  },
);

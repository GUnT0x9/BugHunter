import { Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { SessionAuthGuard } from './session-auth.guard.js';
import { SessionRepository } from './session.repository.js';
import { SessionService } from './session.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    SessionRepository,
    SessionService,
    SessionAuthGuard,
    AdminGuard,
  ],
  exports: [SessionAuthGuard, AdminGuard, SessionService],
})
export class AuthModule {}

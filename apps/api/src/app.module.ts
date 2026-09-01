import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './common/prisma.module.js';
import { RedisModule } from './common/redis.module.js';
import { CommunityModule } from './community/community.module.js';
import { RateLimitGuard } from './common/rate-limit.guard.js';
import { ExecutionsModule } from './executions/executions.module.js';
import { HealthController } from './health/health.controller.js';
import { HealthService } from './health/health.service.js';
import { MissionsModule } from './missions/missions.module.js';
import { ProgressModule } from './progress/progress.module.js';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    CommunityModule,
    MissionsModule,
    ExecutionsModule,
    ProgressModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [HealthService, { provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}

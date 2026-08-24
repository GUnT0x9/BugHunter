import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MissionsModule } from '../missions/missions.module.js';
import { ExecutionStore } from './execution.store.js';
import { ExecutionsController } from './executions.controller.js';
import { ExecutionsService } from './executions.service.js';
import { JudgeQueueService } from './judge-queue.service.js';
import { QueueDispatcherService } from './queue-dispatcher.service.js';
import { SubmissionRepository } from './submission.repository.js';

@Module({
  imports: [AuthModule, MissionsModule],
  controllers: [ExecutionsController],
  providers: [
    ExecutionStore,
    JudgeQueueService,
    QueueDispatcherService,
    SubmissionRepository,
    ExecutionsService,
  ],
  exports: [ExecutionStore, JudgeQueueService],
})
export class ExecutionsModule {}

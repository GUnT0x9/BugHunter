import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminController } from './admin.controller.js';
import { AdminSubmissionsController } from './admin-submissions.controller.js';
import { AdminJudgeValidationService } from './admin-judge-validation.service.js';
import { AdminRepository } from './admin.repository.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminController, AdminSubmissionsController],
  providers: [AdminRepository, AdminJudgeValidationService],
})
export class AdminModule {}

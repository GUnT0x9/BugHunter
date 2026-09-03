import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminController } from './admin.controller.js';
import { AdminSubmissionsController } from './admin-submissions.controller.js';
import { AdminJudgeValidationService } from './admin-judge-validation.service.js';
import { AdminRepository } from './admin.repository.js';
import { AdminUsersController } from './admin-users.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminController, AdminSubmissionsController, AdminUsersController],
  providers: [AdminRepository, AdminJudgeValidationService],
})
export class AdminModule {}

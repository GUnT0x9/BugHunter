import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProgressController } from './progress.controller.js';
import { ProgressRepository } from './progress.repository.js';

@Module({
  imports: [AuthModule],
  controllers: [ProgressController],
  providers: [ProgressRepository],
})
export class ProgressModule {}

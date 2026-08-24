import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ChaptersController } from './chapters.controller.js';
import { MissionRepository } from './mission.repository.js';
import { MissionsController } from './missions.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [MissionsController, ChaptersController],
  providers: [MissionRepository],
  exports: [MissionRepository],
})
export class MissionsModule {}

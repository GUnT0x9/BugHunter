import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProgressModule } from '../progress/progress.module.js';
import { CommunityController } from './community.controller.js';
import { CommunityRepository } from './community.repository.js';
import { CommunityService } from './community.service.js';

@Module({
  imports: [AuthModule, ProgressModule],
  controllers: [CommunityController],
  providers: [CommunityRepository, CommunityService],
})
export class CommunityModule {}

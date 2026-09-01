import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CommunityController } from './community.controller.js';
import { CommunityRepository } from './community.repository.js';
import { CommunityService } from './community.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CommunityController],
  providers: [CommunityRepository, CommunityService],
})
export class CommunityModule {}

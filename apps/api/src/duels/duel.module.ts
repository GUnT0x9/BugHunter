import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DuelController } from './duel.controller.js';
import { DuelService } from './duel.service.js';
import { MissionsModule } from '../missions/missions.module.js';

@Module({
  imports: [AuthModule, MissionsModule],
  controllers: [DuelController],
  providers: [DuelService],
})
export class DuelModule {}

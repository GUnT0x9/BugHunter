import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { User } from '@bughunter/contracts';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { ProgressRepository } from './progress.repository.js';

@Controller()
@UseGuards(SessionAuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressRepository) {}

  @Get('progress')
  dashboard(@CurrentUser() user: User) {
    return this.progress.dashboard(user.id);
  }

  @Get('bugdex')
  bugdex(@CurrentUser() user: User) {
    return this.progress.bugdex(user.id);
  }

  @Get('mastery')
  mastery(@CurrentUser() user: User) {
    return this.progress.mastery(user.id);
  }

  @Get('achievements')
  achievements(@CurrentUser() user: User) {
    return this.progress.achievements(user.id);
  }

  @Get('quests')
  quests(@CurrentUser() user: User) {
    return this.progress.quests(user.id);
  }

  @Post('quests/claim')
  claimQuest(@CurrentUser() user: User, @Body() body: { questKey?: unknown }) {
    return this.progress.claimQuest(
      user.id,
      typeof body.questKey === 'string' ? body.questKey : '',
    );
  }

  @Get('challenges/cooperative')
  cooperativeChallenge(@CurrentUser() user: User) {
    return this.progress.cooperativeChallenge(user.id);
  }

  @Post('challenges/cooperative/claim')
  claimCooperativeChallenge(@CurrentUser() user: User) {
    return this.progress.claimCooperativeChallenge(user.id);
  }

  @Get('statistics')
  statistics(@CurrentUser() user: User) {
    return this.progress.statistics(user.id);
  }

  @Get('profile-summary')
  profileSummary(@CurrentUser() user: User) {
    return this.progress.profileSummary(user.id);
  }
}

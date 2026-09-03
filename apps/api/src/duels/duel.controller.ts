import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { User } from '@bughunter/contracts';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { parseBody } from '../common/validation.js';
import { CreateDuelSchema, JoinDuelSchema } from './duel.schema.js';
import { DuelService } from './duel.service.js';

@Controller('duels')
@UseGuards(SessionAuthGuard)
export class DuelController {
  constructor(private readonly duels: DuelService) {}

  @Get('active')
  active(@CurrentUser() user: User) {
    return this.duels.active(user.id);
  }

  @Get('history')
  history(@CurrentUser() user: User) {
    return this.duels.history(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.duels.get(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: unknown) {
    return this.duels.create(user, parseBody(CreateDuelSchema, body).difficulty);
  }

  @Post(':id/start')
  start(@CurrentUser() user: User, @Param('id') id: string) {
    return this.duels.start(user.id, id);
  }

  @Post('join')
  join(@CurrentUser() user: User, @Body() body: unknown) {
    return this.duels.join(user, parseBody(JoinDuelSchema, body).code);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.duels.cancel(user.id, id);
  }
}

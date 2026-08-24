import { BadRequestException, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { MissionPublic, User } from '@bughunter/contracts';
import { CurrentUser, type RequestWithUser } from '../auth/current-user.decorator.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { SessionService } from '../auth/session.service.js';
import { SESSION_COOKIE_NAME } from '../auth/session.constants.js';
import { MissionRepository } from './mission.repository.js';

@Controller()
export class MissionsController {
  constructor(
    private readonly missions: MissionRepository,
    private readonly sessions: SessionService,
  ) {}

  @Get('missions')
  async list(
    @Req() request: Request & { cookies?: Record<string, string> },
  ): Promise<MissionPublic[]> {
    return this.missions.listPublic(
      await this.sessions.get(request.cookies?.[SESSION_COOKIE_NAME]),
    );
  }

  @Get('missions/:id')
  async get(
    @Param('id') id: string,
    @Req() request: Request & { cookies?: Record<string, string> },
  ): Promise<MissionPublic> {
    return this.missions.getPublic(
      id,
      await this.sessions.get(request.cookies?.[SESSION_COOKIE_NAME]),
    );
  }

  @Post('missions/:id/hints/:level')
  @UseGuards(SessionAuthGuard)
  async revealHint(
    @Param('id') missionId: string,
    @Param('level') levelRaw: string,
    @CurrentUser() user: User,
  ): Promise<{ ok: true }> {
    const level = Number(levelRaw);
    if (!Number.isInteger(level) || level < 1 || level > 3)
      throw new BadRequestException('Invalid hint level');
    await this.missions.recordHint(user.id, missionId, level);
    return { ok: true };
  }
}

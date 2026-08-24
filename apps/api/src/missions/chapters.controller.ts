import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { Chapter } from '@bughunter/contracts';
import { MissionRepository } from './mission.repository.js';
import { SessionService } from '../auth/session.service.js';
import { SESSION_COOKIE_NAME } from '../auth/session.constants.js';

@Controller('chapters')
export class ChaptersController {
  constructor(
    private readonly missions: MissionRepository,
    private readonly sessions: SessionService,
  ) {}

  @Get()
  async list(@Req() request: Request & { cookies?: Record<string, string> }): Promise<Chapter[]> {
    const missions = await this.missions.listPublic(
      await this.sessions.get(request.cookies?.[SESSION_COOKIE_NAME]),
    );
    return [...new Set(missions.map((mission) => mission.chapterOrder))].map((order) => {
      const chapterMissions = missions.filter((mission) => mission.chapterOrder === order);
      const first = chapterMissions[0];
      return {
        id: `chapter-${order}`,
        order,
        title: first?.chapterOrder === 7 ? '예외 처리와 종합 디버깅' : `Chapter ${order}`,
        description: `${chapterMissions.length}개의 Mission으로 구성됩니다.`,
        missionCount: chapterMissions.length,
        completedCount: chapterMissions.filter((mission) => mission.isCompleted).length,
        isLocked: first?.isLocked ?? true,
      };
    });
  }
}

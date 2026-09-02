import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type {
  CommunityUser,
  FollowOverview,
  PublicProfile,
  RankingResponse,
  User,
} from '@bughunter/contracts';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { CommunityService } from './community.service.js';

@Controller('community')
@UseGuards(SessionAuthGuard)
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('rankings')
  rankings(@CurrentUser() user: User): Promise<RankingResponse> {
    return this.community.rankings(user.id);
  }

  @Get('weekly-comparison')
  weeklyComparison(@CurrentUser() user: User) {
    return this.community.weeklyComparison(user.id);
  }

  @Get('users')
  search(@CurrentUser() user: User, @Query('query') query = ''): Promise<CommunityUser[]> {
    return this.community.search(user.id, query);
  }

  @Get('users/:id')
  profile(@CurrentUser() user: User, @Param('id') userId: string): Promise<PublicProfile> {
    return this.community.profile(user.id, userId);
  }

  @Get('users/:id/follows')
  follows(@CurrentUser() user: User, @Param('id') userId: string): Promise<FollowOverview> {
    return this.community.follows(user.id, userId);
  }

  @Post('users/:id/follow')
  follow(@CurrentUser() user: User, @Param('id') userId: string): Promise<{ ok: true }> {
    return this.community.follow(user.id, userId);
  }

  @Delete('users/:id/follow')
  unfollow(@CurrentUser() user: User, @Param('id') userId: string): Promise<{ ok: true }> {
    return this.community.unfollow(user.id, userId);
  }
}

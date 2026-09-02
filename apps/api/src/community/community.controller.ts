import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type {
  CommunityUser,
  FollowOverview,
  FriendOverview,
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

  @Get('friends')
  friends(@CurrentUser() user: User): Promise<FriendOverview> {
    return this.community.friends(user.id);
  }

  @Post('friends/:userId')
  requestFriend(
    @CurrentUser() user: User,
    @Param('userId') targetUserId: string,
  ): Promise<CommunityUser> {
    return this.community.requestFriend(user.id, targetUserId);
  }

  @Post('friendships/:id/accept')
  acceptFriend(
    @CurrentUser() user: User,
    @Param('id') friendshipId: string,
  ): Promise<CommunityUser> {
    return this.community.acceptFriend(user.id, friendshipId);
  }

  @Delete('friendships/:id')
  removeFriendship(
    @CurrentUser() user: User,
    @Param('id') friendshipId: string,
  ): Promise<{ ok: true }> {
    return this.community.removeFriendship(user.id, friendshipId);
  }
}

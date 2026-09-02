import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CommunityUser,
  FollowOverview,
  PublicProfile,
  RankingResponse,
} from '@bughunter/contracts';
import { CommunityRepository } from './community.repository.js';

type CommunityUserRow = NonNullable<Awaited<ReturnType<CommunityRepository['findCommunityUser']>>>;
type FollowRow = { followerId: string; followingId: string };
function toCommunityUser(
  user: CommunityUserRow,
  currentUserId: string,
  follows: FollowRow[],
): CommunityUser {
  return {
    id: user.id,
    username: user.username,
    totalXp: user.totalXp,
    level: Math.floor(user.totalXp / 1_000) + 1,
    solvedCount: user._count.progress,
    isSelf: user.id === currentUserId,
    isFollowing: follows.some(
      (item) => item.followerId === currentUserId && item.followingId === user.id,
    ),
    followsMe: follows.some(
      (item) => item.followerId === user.id && item.followingId === currentUserId,
    ),
  };
}

@Injectable()
export class CommunityService {
  constructor(private readonly repository: CommunityRepository) {}
  async rankings(currentUserId: string): Promise<RankingResponse> {
    const [users, me, follows] = await Promise.all([
      this.repository.topUsers(),
      this.repository.findCommunityUser(currentUserId),
      this.repository.followsForUser(currentUserId),
    ]);
    if (!me) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    let previousXp: number | null = null;
    let currentRank = 0;
    const entries = users.map((user, index) => {
      if (user.totalXp !== previousXp) currentRank = index + 1;
      previousXp = user.totalXp;
      return { ...toCommunityUser(user, currentUserId, follows), rank: currentRank };
    });
    const listedMe = entries.find((entry) => entry.id === currentUserId);
    return {
      entries,
      me: listedMe ?? {
        ...toCommunityUser(me, currentUserId, follows),
        rank: (await this.repository.countUsersAhead(me.totalXp)) + 1,
      },
    };
  }
  async search(currentUserId: string, rawQuery: string): Promise<CommunityUser[]> {
    const query = rawQuery.trim();
    if (query.length < 2) return [];
    if (query.length > 32) throw new BadRequestException('검색어는 32자 이하여야 합니다.');
    const [users, follows] = await Promise.all([
      this.repository.searchUsers(query, currentUserId),
      this.repository.followsForUser(currentUserId),
    ]);
    return users.map((user) => toCommunityUser(user, currentUserId, follows));
  }
  async profile(currentUserId: string, userId: string): Promise<PublicProfile> {
    const [user, follows, counts, activity] = await Promise.all([
      this.repository.findCommunityUser(userId),
      this.repository.followsForUser(currentUserId),
      this.repository.profileCounts(userId),
      this.repository.recentPublicActivity(userId),
    ]);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const [followerCount, followingCount] = counts;
    return {
      ...toCommunityUser(user, currentUserId, follows),
      bio: user.bio,
      joinedAt: user.createdAt.toISOString(),
      followerCount,
      followingCount,
      recentActivity: activity.map((item) => ({
        id: item.missionId,
        title: item.mission.title,
        detail: `${item.mission.bugType.name} 해결`,
        xp: item.mission.baseXp,
        occurredAt: item.completedAt!.toISOString(),
      })),
    };
  }
  async follows(currentUserId: string, userId: string): Promise<FollowOverview> {
    if (!(await this.repository.findCommunityUser(userId)))
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const [[followers, following], myFollows] = await Promise.all([
      this.repository.followOverview(userId),
      this.repository.followsForUser(currentUserId),
    ]);
    return {
      followers: followers.map((item) => toCommunityUser(item.follower, currentUserId, myFollows)),
      following: following.map((item) => toCommunityUser(item.following, currentUserId, myFollows)),
    };
  }
  async follow(currentUserId: string, targetUserId: string): Promise<{ ok: true }> {
    if (currentUserId === targetUserId)
      throw new ConflictException('자기 자신을 팔로우할 수 없습니다.');
    if (!(await this.repository.findCommunityUser(targetUserId)))
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    try {
      await this.repository.createFollow(currentUserId, targetUserId);
    } catch (error: unknown) {
      if (!(
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ))
        throw error;
    }
    return { ok: true };
  }
  async unfollow(currentUserId: string, targetUserId: string): Promise<{ ok: true }> {
    await this.repository.deleteFollow(currentUserId, targetUserId);
    return { ok: true };
  }
}

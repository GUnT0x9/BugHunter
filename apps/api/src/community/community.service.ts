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
import { missionRating } from '@bughunter/contracts';
import { CommunityRepository } from './community.repository.js';
import { ProgressRepository } from '../progress/progress.repository.js';
import { questPeriods } from '../progress/quest-policy.js';
import { cappedSolveTimeSeconds, compareSeasonScores, seasonPeriod } from './season-policy.js';

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
  constructor(
    private readonly repository: CommunityRepository,
    private readonly progress: ProgressRepository,
  ) {}
  async rankings(currentUserId: string): Promise<RankingResponse> {
    const [users, me, follows] = await Promise.all([
      this.repository.topUsers(),
      this.repository.findCommunityUser(currentUserId),
      this.repository.followsForUser(currentUserId),
    ]);
    if (!me) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if ((me as { role?: string }).role === 'ADMIN') {
      let previousXp: number | null = null;
      let currentRank = 0;
      const entries = users.map((user, index) => {
        if (user.totalXp !== previousXp) currentRank = index + 1;
        previousXp = user.totalXp;
        return { ...toCommunityUser(user, currentUserId, follows), rank: currentRank };
      });
      return {
        entries,
        me: { ...toCommunityUser(me, currentUserId, follows), rank: 0 },
      };
    }
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

  async weeklyComparison(currentUserId: string) {
    const { weekly } = questPeriods();
    const follows = await this.repository.followsForUser(currentUserId);
    const followingIds = follows
      .filter((item) => item.followerId === currentUserId)
      .map((item) => item.followingId);
    const users = await this.repository.weeklyComparisonUsers(
      [currentUserId, ...followingIds],
      weekly.startsAt,
      weekly.endsAt,
    );
    const entries = users
      .map((user) => ({
        id: user.id,
        username: user.username,
        isSelf: user.id === currentUserId,
        solvedCount: user.progress.length,
        earnedStars: user.progress.reduce(
          (sum, progress) => sum + missionRating(progress.attempts, progress.highestHint).stars,
          0,
        ),
      }))
      .sort(
        (left, right) =>
          right.solvedCount - left.solvedCount ||
          right.earnedStars - left.earnedStars ||
          left.username.localeCompare(right.username, 'ko'),
      )
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
    return {
      startsAt: weekly.startsAt.toISOString(),
      endsAt: weekly.endsAt.toISOString(),
      entries,
    };
  }

  async seasonRankings(currentUserId: string) {
    const season = seasonPeriod();
    const [users, meRow] = await Promise.all([
      this.repository.seasonUsers(season.startsAt, season.endsAt),
      this.repository.findCommunityUser(currentUserId),
    ]);
    if (meRow && (meRow as { role?: string }).role === 'ADMIN') {
      const ranked = users
        .map((user) => {
          const ratings = user.progress.map((item) => missionRating(item.attempts, item.highestHint));
          const totalSolveTime = user.progress.reduce(
            (sum, item) => sum + cappedSolveTimeSeconds(item.startedAt, item.completedAt!),
            0,
          );
          return {
            id: user.id,
            username: user.username,
            isSelf: false,
            earnedStars: ratings.reduce((sum, rating) => sum + rating.stars, 0),
            solvedCount: user.progress.length,
            averageSolveTimeSeconds: user.progress.length
              ? Math.round(totalSolveTime / user.progress.length)
              : 86_400,
            perfectCount: ratings.filter((rating) => rating.stars === 3).length,
            totalAttempts: user.progress.reduce((sum, item) => sum + item.attempts, 0),
          };
        })
        .sort(compareSeasonScores)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
      return {
        season: {
          key: season.key,
          number: season.number,
          startsAt: season.startsAt.toISOString(),
          endsAt: season.endsAt.toISOString(),
        },
        entries: ranked.slice(0, 100),
        me: {
          id: meRow.id,
          username: meRow.username,
          isSelf: true,
          earnedStars: 0,
          solvedCount: 0,
          averageSolveTimeSeconds: 86_400,
          perfectCount: 0,
          totalAttempts: 0,
          rank: 0,
        },
      };
    }
    const ranked = users
      .map((user) => {
        const ratings = user.progress.map((item) => missionRating(item.attempts, item.highestHint));
        const totalSolveTime = user.progress.reduce(
          (sum, item) => sum + cappedSolveTimeSeconds(item.startedAt, item.completedAt!),
          0,
        );
        return {
          id: user.id,
          username: user.username,
          isSelf: user.id === currentUserId,
          earnedStars: ratings.reduce((sum, rating) => sum + rating.stars, 0),
          solvedCount: user.progress.length,
          averageSolveTimeSeconds: user.progress.length
            ? Math.round(totalSolveTime / user.progress.length)
            : 86_400,
          perfectCount: ratings.filter((rating) => rating.stars === 3).length,
          totalAttempts: user.progress.reduce((sum, item) => sum + item.attempts, 0),
        };
      })
      .sort(compareSeasonScores)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
    return {
      season: {
        key: season.key,
        number: season.number,
        startsAt: season.startsAt.toISOString(),
        endsAt: season.endsAt.toISOString(),
      },
      entries: ranked.slice(0, 100),
      me: ranked.find((entry) => entry.id === currentUserId)!,
    };
  }
  async profile(currentUserId: string, userId: string): Promise<PublicProfile> {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - 83);
    const [user, follows, counts, days, submissionTotals, completedCount, progressTotals, activity, featuredAchievements] =
      await Promise.all([
        this.repository.findCommunityUser(userId),
        this.repository.followsForUser(currentUserId),
        this.repository.profileCounts(userId),
        this.repository.activityDays(userId, since),
        this.repository.submissionTotals(userId),
        this.repository.completedCount(userId),
        this.repository.attemptTotals(userId),
        this.repository.recentPublicActivity(userId),
        this.progress.featuredAchievements(userId),
      ]);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if ((user as { role?: string }).role === 'ADMIN') throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const [followerCount, followingCount] = counts;
    const totalAttempts = progressTotals._sum.attempts ?? 0;
    return {
      ...toCommunityUser(user, currentUserId, follows),
      bio: user.bio,
      joinedAt: user.createdAt.toISOString(),
      followerCount,
      followingCount,
      totalSubmissions: submissionTotals._count._all,
      averageAttempts: completedCount ? Number((totalAttempts / completedCount).toFixed(1)) : 0,
      averageExecutionTimeMs: Math.round(submissionTotals._avg.executionTimeMs ?? 0),
      activityDays: days.map((day) => ({ date: day.date.toISOString().slice(0, 10), count: 1 })),
      featuredAchievements,
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
    const target = await this.repository.findCommunityUser(userId);
    if (!target) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if ((target as { role?: string }).role === 'ADMIN') throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const [[followers, following], myFollows] = await Promise.all([
      this.repository.followOverview(userId),
      this.repository.followsForUser(currentUserId),
    ]);
    const filteredFollowers = followers.filter((item) => (item.follower as { role?: string }).role !== 'ADMIN');
    const filteredFollowing = following.filter((item) => (item.following as { role?: string }).role !== 'ADMIN');
    return {
      followers: filteredFollowers.map((item) => toCommunityUser(item.follower, currentUserId, myFollows)),
      following: filteredFollowing.map((item) => toCommunityUser(item.following, currentUserId, myFollows)),
    };
  }
  async follow(currentUserId: string, targetUserId: string): Promise<{ ok: true }> {
    if (currentUserId === targetUserId)
      throw new ConflictException('자기 자신을 팔로우할 수 없습니다.');
    const target = await this.repository.findCommunityUser(targetUserId);
    if (!target) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if ((target as { role?: string }).role === 'ADMIN') throw new NotFoundException('사용자를 찾을 수 없습니다.');
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

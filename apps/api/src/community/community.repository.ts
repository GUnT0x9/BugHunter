import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service.js';

const communityUserSelect = {
  id: true,
  username: true,
  totalXp: true,
  bio: true,
  createdAt: true,
  role: true,
  _count: { select: { progress: { where: { completedAt: { not: null } } } } },
} as const;

@Injectable()
export class CommunityRepository {
  constructor(private readonly prisma: PrismaService) {}
  topUsers(limit = 50) {
    return this.prisma.user.findMany({
      where: { role: 'USER' },
      select: communityUserSelect,
      orderBy: [{ totalXp: 'desc' }, { username: 'asc' }],
      take: limit,
    });
  }
  findCommunityUser(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: communityUserSelect });
  }
  countUsersAhead(totalXp: number) {
    return this.prisma.user.count({ where: { totalXp: { gt: totalXp }, role: 'USER' } });
  }
  searchUsers(query: string, currentUserId: string) {
    return this.prisma.user.findMany({
      where: { id: { not: currentUserId }, username: { contains: query, mode: 'insensitive' }, role: 'USER' },
      select: communityUserSelect,
      orderBy: [{ totalXp: 'desc' }, { username: 'asc' }],
      take: 20,
    });
  }
  followsForUser(userId: string) {
    return this.prisma.follow.findMany({
      where: { OR: [{ followerId: userId }, { followingId: userId }] },
      select: { followerId: true, followingId: true },
    });
  }
  followOverview(userId: string) {
    return Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        select: { follower: { select: communityUserSelect } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { following: { select: communityUserSelect } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
  }
  createFollow(followerId: string, followingId: string) {
    return this.prisma.follow.create({ data: { followerId, followingId } });
  }
  deleteFollow(followerId: string, followingId: string) {
    return this.prisma.follow.deleteMany({ where: { followerId, followingId } });
  }
  profileCounts(userId: string) {
    return Promise.all([
      this.prisma.follow.count({
        where: { followingId: userId, follower: { role: 'USER' } },
      }),
      this.prisma.follow.count({
        where: { followerId: userId, following: { role: 'USER' } },
      }),
    ]);
  }
  submissionTotals(userId: string) {
    return this.prisma.submission.aggregate({
      where: { userId },
      _count: { _all: true },
      _avg: { executionTimeMs: true },
    });
  }
  completedCount(userId: string) {
    return this.prisma.missionProgress.count({ where: { userId, completedAt: { not: null } } });
  }
  attemptTotals(userId: string) {
    return this.prisma.missionProgress.aggregate({
      where: { userId },
      _sum: { attempts: true },
    });
  }
  activityDays(userId: string, since: Date) {
    return this.prisma.learningDay.findMany({
      where: { userId, date: { gte: since } },
      select: { date: true },
      orderBy: { date: 'asc' },
    });
  }
  recentPublicActivity(userId: string) {
    return this.prisma.missionProgress.findMany({
      where: { userId, completedAt: { not: null } },
      select: {
        missionId: true,
        completedAt: true,
        mission: { select: { title: true, baseXp: true, bugType: { select: { name: true } } } },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });
  }

  weeklyComparisonUsers(userIds: string[], startsAt: Date, endsAt: Date) {
    return this.prisma.user.findMany({
      where: { id: { in: userIds }, role: 'USER' },
      select: {
        id: true,
        username: true,
        progress: {
          where: { completedAt: { gte: startsAt, lt: endsAt } },
          select: { attempts: true, highestHint: true },
        },
      },
    });
  }
  seasonUsers(startsAt: Date, endsAt: Date) {
    return this.prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        username: true,
        progress: {
          where: { completedAt: { gte: startsAt, lt: endsAt } },
          select: { startedAt: true, completedAt: true, attempts: true, highestHint: true },
        },
      },
    });
  }
}

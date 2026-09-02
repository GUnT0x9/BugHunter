import { Injectable } from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';

const communityUserSelect = {
  id: true,
  username: true,
  totalXp: true,
  bio: true,
  createdAt: true,
  _count: { select: { progress: { where: { completedAt: { not: null } } } } },
} as const;

const friendshipInclude = {
  userA: { select: communityUserSelect },
  userB: { select: communityUserSelect },
} as const;

export function orderedUserIds(firstId: string, secondId: string): [string, string] {
  return firstId < secondId ? [firstId, secondId] : [secondId, firstId];
}

@Injectable()
export class CommunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  topUsers(limit = 50) {
    return this.prisma.user.findMany({
      select: communityUserSelect,
      orderBy: [{ totalXp: 'desc' }, { username: 'asc' }],
      take: limit,
    });
  }

  findCommunityUser(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: communityUserSelect });
  }

  countUsersAhead(totalXp: number) {
    return this.prisma.user.count({ where: { totalXp: { gt: totalXp } } });
  }

  searchUsers(query: string, currentUserId: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        username: { contains: query, mode: 'insensitive' },
      },
      select: communityUserSelect,
      orderBy: [{ totalXp: 'desc' }, { username: 'asc' }],
      take: 20,
    });
  }

  relationshipsForUser(userId: string) {
    return this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: friendshipInclude,
      orderBy: { updatedAt: 'desc' },
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
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
      this.prisma.friendship.count({
        where: {
          status: FriendshipStatus.ACCEPTED,
          OR: [{ userAId: userId }, { userBId: userId }],
        },
      }),
    ]);
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

  findRelationship(firstId: string, secondId: string) {
    const [userAId, userBId] = orderedUserIds(firstId, secondId);
    return this.prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      include: friendshipInclude,
    });
  }

  findRelationshipById(id: string) {
    return this.prisma.friendship.findUnique({ where: { id }, include: friendshipInclude });
  }

  createRequest(requestedById: string, targetUserId: string) {
    const [userAId, userBId] = orderedUserIds(requestedById, targetUserId);
    return this.prisma.friendship.create({
      data: { userAId, userBId, requestedById },
      include: friendshipInclude,
    });
  }

  accept(id: string) {
    return this.prisma.friendship.update({
      where: { id },
      data: { status: FriendshipStatus.ACCEPTED },
      include: friendshipInclude,
    });
  }

  delete(id: string) {
    return this.prisma.friendship.delete({ where: { id } });
  }
}

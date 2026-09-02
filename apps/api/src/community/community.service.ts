import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CommunityRelationship,
  CommunityUser,
  FriendOverview,
  FollowOverview,
  PublicProfile,
  RankingResponse,
} from '@bughunter/contracts';
import { FriendshipStatus } from '@prisma/client';
import { CommunityRepository } from './community.repository.js';

type CommunityUserRow = Awaited<ReturnType<CommunityRepository['findCommunityUser']>> & object;
type FriendshipRow = NonNullable<Awaited<ReturnType<CommunityRepository['findRelationshipById']>>>;

function relationshipFor(
  friendship: FriendshipRow | undefined,
  currentUserId: string,
): CommunityRelationship {
  if (!friendship) return 'NONE';
  if (friendship.status === FriendshipStatus.ACCEPTED) return 'FRIEND';
  return friendship.requestedById === currentUserId ? 'PENDING_OUTGOING' : 'PENDING_INCOMING';
}

function toCommunityUser(
  user: NonNullable<CommunityUserRow>,
  relationship: CommunityRelationship,
  friendshipId: string | null,
  isFollowing = false,
  followsMe = false,
): CommunityUser {
  return {
    id: user.id,
    username: user.username,
    totalXp: user.totalXp,
    level: Math.floor(user.totalXp / 1_000) + 1,
    solvedCount: user._count.progress,
    relationship,
    friendshipId,
    isFollowing,
    followsMe,
  };
}

@Injectable()
export class CommunityService {
  constructor(private readonly repository: CommunityRepository) {}

  async rankings(currentUserId: string): Promise<RankingResponse> {
    const [users, me, relationships, follows] = await Promise.all([
      this.repository.topUsers(),
      this.repository.findCommunityUser(currentUserId),
      this.repository.relationshipsForUser(currentUserId),
      this.repository.followsForUser(currentUserId),
    ]);
    if (!me) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const relationMap = new Map(
      relationships.map((item) => [
        item.userAId === currentUserId ? item.userBId : item.userAId,
        item,
      ]),
    );
    const following = new Set(
      follows.filter((item) => item.followerId === currentUserId).map((item) => item.followingId),
    );
    const followers = new Set(
      follows.filter((item) => item.followingId === currentUserId).map((item) => item.followerId),
    );
    let previousXp: number | null = null;
    let currentRank = 0;
    const entries = users.map((user, index) => {
      if (user.totalXp !== previousXp) currentRank = index + 1;
      previousXp = user.totalXp;
      const friendship = relationMap.get(user.id);
      return {
        ...toCommunityUser(
          user,
          user.id === currentUserId ? 'SELF' : relationshipFor(friendship, currentUserId),
          friendship?.id ?? null,
          following.has(user.id),
          followers.has(user.id),
        ),
        rank: currentRank,
      };
    });
    const listedMe = entries.find((entry) => entry.id === currentUserId);
    const meRank = listedMe?.rank ?? (await this.repository.countUsersAhead(me.totalXp)) + 1;
    return {
      entries,
      me: listedMe ?? { ...toCommunityUser(me, 'SELF', null, false, false), rank: meRank },
    };
  }

  async search(currentUserId: string, rawQuery: string): Promise<CommunityUser[]> {
    const query = rawQuery.trim();
    if (query.length < 2) return [];
    if (query.length > 32) throw new BadRequestException('검색어는 32자 이하여야 합니다.');
    const [users, relationships, follows] = await Promise.all([
      this.repository.searchUsers(query, currentUserId),
      this.repository.relationshipsForUser(currentUserId),
      this.repository.followsForUser(currentUserId),
    ]);
    const relationMap = new Map(
      relationships.map((item) => [
        item.userAId === currentUserId ? item.userBId : item.userAId,
        item,
      ]),
    );
    const following = new Set(
      follows.filter((item) => item.followerId === currentUserId).map((item) => item.followingId),
    );
    const followers = new Set(
      follows.filter((item) => item.followingId === currentUserId).map((item) => item.followerId),
    );
    return users.map((user) => {
      const friendship = relationMap.get(user.id);
      return toCommunityUser(
        user,
        relationshipFor(friendship, currentUserId),
        friendship?.id ?? null,
        following.has(user.id),
        followers.has(user.id),
      );
    });
  }

  async profile(currentUserId: string, userId: string): Promise<PublicProfile> {
    const [user, relationship, follows, counts, activity] = await Promise.all([
      this.repository.findCommunityUser(userId),
      this.repository.findRelationship(currentUserId, userId),
      this.repository.followsForUser(currentUserId),
      this.repository.profileCounts(userId),
      this.repository.recentPublicActivity(userId),
    ]);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const [followerCount, followingCount, friendCount] = counts;
    return {
      ...toCommunityUser(
        user,
        userId === currentUserId
          ? 'SELF'
          : relationshipFor(relationship ?? undefined, currentUserId),
        relationship?.id ?? null,
        follows.some((item) => item.followerId === currentUserId && item.followingId === userId),
        follows.some((item) => item.followerId === userId && item.followingId === currentUserId),
      ),
      bio: user.bio,
      joinedAt: user.createdAt.toISOString(),
      followerCount,
      followingCount,
      friendCount,
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
    if (!(await this.repository.findCommunityUser(userId))) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    const [[followers, following], relationships, myFollows] = await Promise.all([
      this.repository.followOverview(userId),
      this.repository.relationshipsForUser(currentUserId),
      this.repository.followsForUser(currentUserId),
    ]);
    const relationMap = new Map(
      relationships.map((item) => [
        item.userAId === currentUserId ? item.userBId : item.userAId,
        item,
      ]),
    );
    const convert = (user: (typeof followers)[number]['follower']) => {
      const friendship = relationMap.get(user.id);
      return toCommunityUser(
        user,
        user.id === currentUserId ? 'SELF' : relationshipFor(friendship, currentUserId),
        friendship?.id ?? null,
        myFollows.some((item) => item.followerId === currentUserId && item.followingId === user.id),
        myFollows.some((item) => item.followerId === user.id && item.followingId === currentUserId),
      );
    };
    return {
      followers: followers.map((item) => convert(item.follower)),
      following: following.map((item) => convert(item.following)),
    };
  }

  async follow(currentUserId: string, targetUserId: string): Promise<{ ok: true }> {
    if (currentUserId === targetUserId)
      throw new ConflictException('자기 자신을 팔로우할 수 없습니다.');
    if (!(await this.repository.findCommunityUser(targetUserId))) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    try {
      await this.repository.createFollow(currentUserId, targetUserId);
      return { ok: true };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return { ok: true };
      }
      throw error;
    }
  }

  async unfollow(currentUserId: string, targetUserId: string): Promise<{ ok: true }> {
    await this.repository.deleteFollow(currentUserId, targetUserId);
    return { ok: true };
  }

  async friends(currentUserId: string): Promise<FriendOverview> {
    const relationships = await this.repository.relationshipsForUser(currentUserId);
    const result: FriendOverview = { friends: [], incoming: [], outgoing: [] };
    for (const friendship of relationships) {
      const other = friendship.userAId === currentUserId ? friendship.userB : friendship.userA;
      const relationship = relationshipFor(friendship, currentUserId);
      const user = toCommunityUser(other, relationship, friendship.id);
      if (relationship === 'FRIEND') result.friends.push(user);
      else if (relationship === 'PENDING_INCOMING') result.incoming.push(user);
      else result.outgoing.push(user);
    }
    return result;
  }

  async requestFriend(currentUserId: string, targetUserId: string): Promise<CommunityUser> {
    if (currentUserId === targetUserId)
      throw new ConflictException('자기 자신에게 친구 요청을 보낼 수 없습니다.');
    const [target, existing] = await Promise.all([
      this.repository.findCommunityUser(targetUserId),
      this.repository.findRelationship(currentUserId, targetUserId),
    ]);
    if (!target) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if (existing) throw new ConflictException('이미 친구이거나 처리 중인 요청이 있습니다.');
    try {
      const friendship = await this.repository.createRequest(currentUserId, targetUserId);
      return toCommunityUser(target, 'PENDING_OUTGOING', friendship.id);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('이미 친구이거나 처리 중인 요청이 있습니다.');
      }
      throw error;
    }
  }

  async acceptFriend(currentUserId: string, friendshipId: string): Promise<CommunityUser> {
    const friendship = await this.requireMembership(currentUserId, friendshipId);
    if (
      friendship.status !== FriendshipStatus.PENDING ||
      friendship.requestedById === currentUserId
    ) {
      throw new ForbiddenException('받은 친구 요청만 수락할 수 있습니다.');
    }
    const accepted = await this.repository.accept(friendshipId);
    const other = accepted.userAId === currentUserId ? accepted.userB : accepted.userA;
    return toCommunityUser(other, 'FRIEND', accepted.id);
  }

  async removeFriendship(currentUserId: string, friendshipId: string): Promise<{ ok: true }> {
    await this.requireMembership(currentUserId, friendshipId);
    await this.repository.delete(friendshipId);
    return { ok: true };
  }

  private async requireMembership(
    currentUserId: string,
    friendshipId: string,
  ): Promise<FriendshipRow> {
    const friendship = await this.repository.findRelationshipById(friendshipId);
    if (!friendship) throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    if (friendship.userAId !== currentUserId && friendship.userBId !== currentUserId) {
      throw new ForbiddenException('이 친구 관계를 변경할 수 없습니다.');
    }
    return friendship;
  }
}

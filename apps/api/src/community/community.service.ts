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
  RankingResponse,
} from '@bughunter/contracts';
import { FriendshipStatus } from '@prisma/client';
import { CommunityRepository } from './community.repository.js';

type CommunityUserRow = Awaited<ReturnType<CommunityRepository['findCommunityUser']>> & object;
type FriendshipRow = NonNullable<
  Awaited<ReturnType<CommunityRepository['findRelationshipById']>>
>;

function relationshipFor(friendship: FriendshipRow | undefined, currentUserId: string): CommunityRelationship {
  if (!friendship) return 'NONE';
  if (friendship.status === FriendshipStatus.ACCEPTED) return 'FRIEND';
  return friendship.requestedById === currentUserId ? 'PENDING_OUTGOING' : 'PENDING_INCOMING';
}

function toCommunityUser(
  user: NonNullable<CommunityUserRow>,
  relationship: CommunityRelationship,
  friendshipId: string | null,
): CommunityUser {
  return {
    id: user.id,
    username: user.username,
    totalXp: user.totalXp,
    level: Math.floor(user.totalXp / 1_000) + 1,
    solvedCount: user._count.progress,
    relationship,
    friendshipId,
  };
}

@Injectable()
export class CommunityService {
  constructor(private readonly repository: CommunityRepository) {}

  async rankings(currentUserId: string): Promise<RankingResponse> {
    const [users, me, relationships] = await Promise.all([
      this.repository.topUsers(),
      this.repository.findCommunityUser(currentUserId),
      this.repository.relationshipsForUser(currentUserId),
    ]);
    if (!me) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const relationMap = new Map(
      relationships.map((item) => [item.userAId === currentUserId ? item.userBId : item.userAId, item]),
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
        ),
        rank: currentRank,
      };
    });
    const listedMe = entries.find((entry) => entry.id === currentUserId);
    const meRank = listedMe?.rank ?? (await this.repository.countUsersAhead(me.totalXp)) + 1;
    return {
      entries,
      me: listedMe ?? { ...toCommunityUser(me, 'SELF', null), rank: meRank },
    };
  }

  async search(currentUserId: string, rawQuery: string): Promise<CommunityUser[]> {
    const query = rawQuery.trim();
    if (query.length < 2) return [];
    if (query.length > 32) throw new BadRequestException('검색어는 32자 이하여야 합니다.');
    const [users, relationships] = await Promise.all([
      this.repository.searchUsers(query, currentUserId),
      this.repository.relationshipsForUser(currentUserId),
    ]);
    const relationMap = new Map(
      relationships.map((item) => [item.userAId === currentUserId ? item.userBId : item.userAId, item]),
    );
    return users.map((user) => {
      const friendship = relationMap.get(user.id);
      return toCommunityUser(
        user,
        relationshipFor(friendship, currentUserId),
        friendship?.id ?? null,
      );
    });
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
    if (currentUserId === targetUserId) throw new ConflictException('자기 자신에게 친구 요청을 보낼 수 없습니다.');
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
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('이미 친구이거나 처리 중인 요청이 있습니다.');
      }
      throw error;
    }
  }

  async acceptFriend(currentUserId: string, friendshipId: string): Promise<CommunityUser> {
    const friendship = await this.requireMembership(currentUserId, friendshipId);
    if (friendship.status !== FriendshipStatus.PENDING || friendship.requestedById === currentUserId) {
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

  private async requireMembership(currentUserId: string, friendshipId: string): Promise<FriendshipRow> {
    const friendship = await this.repository.findRelationshipById(friendshipId);
    if (!friendship) throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    if (friendship.userAId !== currentUserId && friendship.userBId !== currentUserId) {
      throw new ForbiddenException('이 친구 관계를 변경할 수 없습니다.');
    }
    return friendship;
  }
}

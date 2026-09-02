import { ForbiddenException } from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { CommunityRepository, orderedUserIds } from './community.repository.js';
import { CommunityService } from './community.service.js';

const userA = {
  id: 'user-a',
  username: '알파',
  totalXp: 1_200,
  bio: '알파 소개',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  _count: { progress: 4 },
};
const userB = {
  id: 'user-b',
  username: '베타',
  totalXp: 800,
  bio: '',
  createdAt: new Date('2026-02-01T00:00:00.000Z'),
  _count: { progress: 2 },
};

function setup() {
  const repository = {
    topUsers: vi.fn(),
    findCommunityUser: vi.fn(),
    countUsersAhead: vi.fn(),
    searchUsers: vi.fn(),
    relationshipsForUser: vi.fn(),
    followsForUser: vi.fn().mockResolvedValue([]),
    followOverview: vi.fn(),
    createFollow: vi.fn(),
    deleteFollow: vi.fn(),
    profileCounts: vi.fn(),
    recentPublicActivity: vi.fn(),
    findRelationship: vi.fn(),
    findRelationshipById: vi.fn(),
    createRequest: vi.fn(),
    accept: vi.fn(),
    delete: vi.fn(),
  };
  return {
    repository,
    service: new CommunityService(repository as unknown as CommunityRepository),
  };
}

describe('CommunityService', () => {
  it('canonicalizes a friendship pair regardless of request direction', () => {
    expect(orderedUserIds('user-z', 'user-a')).toEqual(['user-a', 'user-z']);
    expect(orderedUserIds('user-a', 'user-z')).toEqual(['user-a', 'user-z']);
  });

  it('creates and removes a directional follow independently from friendship', async () => {
    const { repository, service } = setup();
    repository.findCommunityUser.mockResolvedValue(userB);
    repository.createFollow.mockResolvedValue({ followerId: 'user-a', followingId: 'user-b' });
    repository.deleteFollow.mockResolvedValue({ count: 1 });

    await expect(service.follow('user-a', 'user-b')).resolves.toEqual({ ok: true });
    await expect(service.unfollow('user-a', 'user-b')).resolves.toEqual({ ok: true });
    expect(repository.createFollow).toHaveBeenCalledWith('user-a', 'user-b');
    expect(repository.deleteFollow).toHaveBeenCalledWith('user-a', 'user-b');
  });

  it('builds a public profile without exposing private account fields', async () => {
    const { repository, service } = setup();
    repository.findCommunityUser.mockResolvedValue(userB);
    repository.findRelationship.mockResolvedValue(null);
    repository.followsForUser.mockResolvedValue([
      { followerId: 'user-a', followingId: 'user-b' },
      { followerId: 'user-b', followingId: 'user-a' },
    ]);
    repository.profileCounts.mockResolvedValue([3, 4, 2]);
    repository.recentPublicActivity.mockResolvedValue([
      {
        missionId: 'mission-1',
        completedAt: new Date('2026-08-31T00:00:00.000Z'),
        mission: { title: '오프바이원', baseXp: 100, bugType: { name: '경계값' } },
      },
    ]);

    const result = await service.profile('user-a', 'user-b');

    expect(result).toMatchObject({
      id: 'user-b',
      bio: '',
      followerCount: 3,
      followingCount: 4,
      friendCount: 2,
      isFollowing: true,
      followsMe: true,
    });
    expect(result.recentActivity[0]).toMatchObject({ title: '오프바이원', xp: 100 });
    expect(result).not.toHaveProperty('email');
  });

  it('returns the XP ranking and marks the signed-in user', async () => {
    const { repository, service } = setup();
    repository.topUsers.mockResolvedValue([userA, userB]);
    repository.findCommunityUser.mockResolvedValue(userA);
    repository.relationshipsForUser.mockResolvedValue([]);

    const result = await service.rankings('user-a');

    expect(result.me).toMatchObject({ id: 'user-a', rank: 1, relationship: 'SELF', level: 2 });
    expect(result.entries[1]).toMatchObject({ id: 'user-b', rank: 2, relationship: 'NONE' });
  });

  it('only lets the recipient accept a pending request', async () => {
    const { repository, service } = setup();
    const pending = {
      id: 'friendship-1',
      userAId: 'user-a',
      userBId: 'user-b',
      requestedById: 'user-a',
      status: FriendshipStatus.PENDING,
      userA,
      userB,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.findRelationshipById.mockResolvedValue(pending);
    repository.accept.mockResolvedValue({ ...pending, status: FriendshipStatus.ACCEPTED });

    await expect(service.acceptFriend('user-a', pending.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.acceptFriend('user-b', pending.id)).resolves.toMatchObject({
      id: 'user-a',
      relationship: 'FRIEND',
    });
  });

  it('separates incoming, outgoing and accepted relationships', async () => {
    const { repository, service } = setup();
    repository.relationshipsForUser.mockResolvedValue([
      {
        id: 'one',
        userAId: 'user-a',
        userBId: 'user-b',
        requestedById: 'user-b',
        status: FriendshipStatus.PENDING,
        userA,
        userB,
      },
      {
        id: 'two',
        userAId: 'user-a',
        userBId: 'user-c',
        requestedById: 'user-a',
        status: FriendshipStatus.PENDING,
        userA,
        userB: { ...userB, id: 'user-c' },
      },
      {
        id: 'three',
        userAId: 'user-a',
        userBId: 'user-d',
        requestedById: 'user-d',
        status: FriendshipStatus.ACCEPTED,
        userA,
        userB: { ...userB, id: 'user-d' },
      },
    ]);

    const result = await service.friends('user-a');

    expect(result.incoming).toHaveLength(1);
    expect(result.outgoing).toHaveLength(1);
    expect(result.friends).toHaveLength(1);
  });
});

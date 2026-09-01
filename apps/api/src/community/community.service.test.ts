import { ForbiddenException } from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { CommunityRepository, orderedUserIds } from './community.repository.js';
import { CommunityService } from './community.service.js';

const userA = {
  id: 'user-a',
  username: '알파',
  totalXp: 1_200,
  _count: { progress: 4 },
};
const userB = {
  id: 'user-b',
  username: '베타',
  totalXp: 800,
  _count: { progress: 2 },
};

function setup() {
  const repository = {
    topUsers: vi.fn(),
    findCommunityUser: vi.fn(),
    countUsersAhead: vi.fn(),
    searchUsers: vi.fn(),
    relationshipsForUser: vi.fn(),
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

    await expect(service.acceptFriend('user-a', pending.id)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.acceptFriend('user-b', pending.id)).resolves.toMatchObject({
      id: 'user-a',
      relationship: 'FRIEND',
    });
  });

  it('separates incoming, outgoing and accepted relationships', async () => {
    const { repository, service } = setup();
    repository.relationshipsForUser.mockResolvedValue([
      { id: 'one', userAId: 'user-a', userBId: 'user-b', requestedById: 'user-b', status: FriendshipStatus.PENDING, userA, userB },
      { id: 'two', userAId: 'user-a', userBId: 'user-c', requestedById: 'user-a', status: FriendshipStatus.PENDING, userA, userB: { ...userB, id: 'user-c' } },
      { id: 'three', userAId: 'user-a', userBId: 'user-d', requestedById: 'user-d', status: FriendshipStatus.ACCEPTED, userA, userB: { ...userB, id: 'user-d' } },
    ]);

    const result = await service.friends('user-a');

    expect(result.incoming).toHaveLength(1);
    expect(result.outgoing).toHaveLength(1);
    expect(result.friends).toHaveLength(1);
  });
});

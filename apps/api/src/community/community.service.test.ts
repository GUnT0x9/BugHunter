import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CommunityRepository } from './community.repository.js';
import { CommunityService } from './community.service.js';

const userA = {
  id: 'user-a',
  username: '알파',
  totalXp: 1_200,
  bio: '소개',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  _count: { progress: 4 },
};
const userB = {
  id: 'user-b',
  username: '베타',
  totalXp: 800,
  bio: '',
  createdAt: new Date('2026-02-01T00:00:00Z'),
  _count: { progress: 2 },
};
function setup() {
  const repository = {
    topUsers: vi.fn(),
    findCommunityUser: vi.fn(),
    countUsersAhead: vi.fn(),
    searchUsers: vi.fn(),
    followsForUser: vi.fn().mockResolvedValue([]),
    followOverview: vi.fn(),
    createFollow: vi.fn(),
    deleteFollow: vi.fn(),
    profileCounts: vi.fn(),
    recentPublicActivity: vi.fn(),
  };
  return {
    repository,
    service: new CommunityService(repository as unknown as CommunityRepository),
  };
}

describe('CommunityService', () => {
  it('returns rankings with directional follow state', async () => {
    const { repository, service } = setup();
    repository.topUsers.mockResolvedValue([userA, userB]);
    repository.findCommunityUser.mockResolvedValue(userA);
    repository.followsForUser.mockResolvedValue([{ followerId: 'user-a', followingId: 'user-b' }]);
    const result = await service.rankings('user-a');
    expect(result.me).toMatchObject({ id: 'user-a', isSelf: true, rank: 1 });
    expect(result.entries[1]).toMatchObject({ id: 'user-b', isFollowing: true, followsMe: false });
  });

  it('creates and removes a directional follow idempotently', async () => {
    const { repository, service } = setup();
    repository.findCommunityUser.mockResolvedValue(userB);
    repository.createFollow.mockResolvedValue({});
    repository.deleteFollow.mockResolvedValue({ count: 1 });
    await expect(service.follow('user-a', 'user-b')).resolves.toEqual({ ok: true });
    await expect(service.unfollow('user-a', 'user-b')).resolves.toEqual({ ok: true });
    await expect(service.follow('user-a', 'user-a')).rejects.toBeInstanceOf(ConflictException);
  });

  it('builds a public profile without private account fields', async () => {
    const { repository, service } = setup();
    repository.findCommunityUser.mockResolvedValue(userB);
    repository.followsForUser.mockResolvedValue([
      { followerId: 'user-a', followingId: 'user-b' },
      { followerId: 'user-b', followingId: 'user-a' },
    ]);
    repository.profileCounts.mockResolvedValue([3, 4]);
    repository.recentPublicActivity.mockResolvedValue([
      {
        missionId: 'm1',
        completedAt: new Date('2026-08-31T00:00:00Z'),
        mission: { title: '오프바이원', baseXp: 100, bugType: { name: '경계값' } },
      },
    ]);
    const result = await service.profile('user-a', 'user-b');
    expect(result).toMatchObject({
      followerCount: 3,
      followingCount: 4,
      isFollowing: true,
      followsMe: true,
    });
    expect(result).not.toHaveProperty('email');
  });
});

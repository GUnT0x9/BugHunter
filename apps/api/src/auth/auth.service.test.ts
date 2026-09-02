import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

const PASSWORD = 'correct-password';
let passwordHash = '';

beforeAll(async () => {
  passwordHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
});

function userRow(
  overrides: Partial<{ email: string; username: string; bio: string; passwordHash: string }> = {},
) {
  return {
    id: 'user-1',
    email: overrides.email ?? 'hunter@example.com',
    username: overrides.username ?? '버그탐정',
    bio: overrides.bio ?? '',
    passwordHash: overrides.passwordHash ?? passwordHash,
    role: 'USER' as const,
    totalXp: 0,
    createdAt: new Date('2026-08-19T00:00:00.000Z'),
    updatedAt: new Date('2026-08-19T00:00:00.000Z'),
  };
}

function setup() {
  const repository = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findByUsername: vi.fn(),
    create: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
  };
  return {
    repository,
    service: new AuthService(repository as unknown as AuthRepository),
  };
}

describe('AuthService', () => {
  it('normalizes registration fields and stores an Argon2id password hash', async () => {
    const { repository, service } = setup();
    repository.findByEmail.mockResolvedValue(null);
    repository.findByUsername.mockResolvedValue(null);
    repository.create.mockImplementation(
      async (input: { email: string; username: string; passwordHash: string }) => userRow(input),
    );

    const user = await service.register({
      email: '  HUNTER@EXAMPLE.COM ',
      username: ' 버그탐정 ',
      password: PASSWORD,
    });

    expect(repository.findByEmail).toHaveBeenCalledWith('hunter@example.com');
    expect(repository.findByUsername).toHaveBeenCalledWith('버그탐정');
    const createdInput = repository.create.mock.calls[0]?.[0];
    expect(createdInput?.passwordHash).not.toBe(PASSWORD);
    expect(await argon2.verify(createdInput?.passwordHash ?? '', PASSWORD)).toBe(true);
    expect(user).toEqual({
      id: 'user-1',
      email: 'hunter@example.com',
      username: '버그탐정',
      bio: '',
      role: 'USER',
      totalXp: 0,
    });
  });

  it('rejects a duplicate nickname before hashing and creating a user', async () => {
    const { repository, service } = setup();
    repository.findByEmail.mockResolvedValue(null);
    repository.findByUsername.mockResolvedValue(userRow());

    await expect(
      service.register({
        email: 'other@example.com',
        username: '버그탐정',
        password: PASSWORD,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns the public user for a valid login', async () => {
    const { repository, service } = setup();
    repository.findByEmail.mockResolvedValue(userRow());

    await expect(
      service.login({ email: 'HUNTER@EXAMPLE.COM', password: PASSWORD }),
    ).resolves.toMatchObject({ id: 'user-1', email: 'hunter@example.com' });
  });

  it('uses the same unauthorized response for an unknown email and a wrong password', async () => {
    const { repository, service } = setup();
    repository.findByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce(userRow());

    await expect(
      service.login({ email: 'missing@example.com', password: PASSWORD }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.login({ email: 'hunter@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('updates a nickname and returns only public user fields', async () => {
    const { repository, service } = setup();
    repository.updateProfile.mockResolvedValue(userRow({ username: '새 디버거', bio: '소개' }));

    await expect(
      service.updateProfile('user-1', { username: '새 디버거', bio: '소개' }),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'hunter@example.com',
      username: '새 디버거',
      bio: '소개',
      role: 'USER',
      totalXp: 0,
    });
    expect(repository.updateProfile).toHaveBeenCalledWith('user-1', '새 디버거', '소개');
  });

  it('returns a conflict when an updated nickname is already used', async () => {
    const { repository, service } = setup();
    repository.updateProfile.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.updateProfile('user-1', { username: '중복 닉네임', bio: '' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes an account only after verifying its password', async () => {
    const { repository, service } = setup();
    repository.findById.mockResolvedValue(userRow());

    await service.deleteAccount('user-1', PASSWORD);
    expect(repository.deleteAccount).toHaveBeenCalledWith('user-1');

    await expect(service.deleteAccount('user-1', 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

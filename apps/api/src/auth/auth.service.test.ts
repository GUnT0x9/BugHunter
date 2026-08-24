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
  overrides: Partial<{ email: string; username: string; passwordHash: string }> = {},
) {
  return {
    id: 'user-1',
    email: overrides.email ?? 'hunter@example.com',
    username: overrides.username ?? '버그탐정',
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
    findByUsername: vi.fn(),
    create: vi.fn(),
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
});

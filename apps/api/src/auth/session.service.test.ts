import { describe, expect, it, vi } from 'vitest';
import { SessionRepository } from './session.repository.js';
import { SessionService } from './session.service.js';

function setup() {
  const sessions = {
    create: vi.fn().mockResolvedValue({}),
    findById: vi.fn(),
    refresh: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({ count: 1 }),
  };
  const service = new SessionService(sessions as unknown as SessionRepository);
  return { sessions, service };
}

describe('SessionService', () => {
  it('stores an opaque session linked to the user in PostgreSQL', async () => {
    const { sessions, service } = setup();
    const sessionId = await service.create('user-1');

    expect(sessionId).toHaveLength(43);
    expect(sessions.create).toHaveBeenCalledWith(sessionId, 'user-1', expect.any(Date));
  });

  it('loads current user data and extends an active session', async () => {
    const { sessions, service } = setup();
    sessions.findById.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user-1',
        email: 'hunter@example.com',
        username: '버그탐정',
        role: 'USER',
        totalXp: 120,
      },
    });

    await expect(service.get('session-1')).resolves.toMatchObject({ totalXp: 120 });
    expect(sessions.refresh).toHaveBeenCalledWith('session-1', expect.any(Date));
  });

  it('removes expired sessions', async () => {
    const { sessions, service } = setup();
    sessions.findById.mockResolvedValue({
      expiresAt: new Date(Date.now() - 1),
      user: {
        id: 'user-1',
        email: 'hunter@example.com',
        username: '버그탐정',
        role: 'USER',
        totalXp: 0,
      },
    });

    await expect(service.get('session-1')).resolves.toBeNull();
    expect(sessions.delete).toHaveBeenCalledWith('session-1');
  });
});

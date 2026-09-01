import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { User } from '@bughunter/contracts';
import { SESSION_TTL_SECONDS } from './session.constants.js';
import { SessionRepository } from './session.repository.js';

// Avoid turning every authenticated read request into a database write. A session
// only needs its sliding expiry extended once it has entered the latter half of
// its lifetime.
const SESSION_REFRESH_THRESHOLD_MS = (SESSION_TTL_SECONDS * 1_000) / 2;

function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_TTL_SECONDS * 1_000);
}

@Injectable()
export class SessionService {
  constructor(private readonly sessions: SessionRepository) {}

  async create(userId: string): Promise<string> {
    const id = randomBytes(32).toString('base64url');
    await this.sessions.create(id, userId, sessionExpiry());
    return id;
  }

  async get(id: string | undefined): Promise<User | null> {
    if (!id) return null;
    const session = await this.sessions.findById(id);
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.destroy(id);
      return null;
    }
    if (session.expiresAt.getTime() - Date.now() <= SESSION_REFRESH_THRESHOLD_MS) {
      await this.sessions.refresh(id, sessionExpiry());
    }
    return session.user satisfies User;
  }

  async destroy(id: string | undefined): Promise<void> {
    if (id) await this.sessions.delete(id);
  }
}

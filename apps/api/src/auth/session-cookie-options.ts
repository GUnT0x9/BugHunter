import type { CookieOptions } from 'express';
import type { AppEnv } from '../common/env.js';
import { SESSION_TTL_SECONDS } from './session.constants.js';

type SessionCookieEnvironment = Pick<AppEnv, 'NODE_ENV' | 'SESSION_COOKIE_SAME_SITE'>;

export function createSessionCookieOptions(env: SessionCookieEnvironment): CookieOptions {
  return {
    httpOnly: true,
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    secure: env.NODE_ENV === 'production' || env.SESSION_COOKIE_SAME_SITE === 'none',
    maxAge: SESSION_TTL_SECONDS * 1_000,
    path: '/',
  };
}

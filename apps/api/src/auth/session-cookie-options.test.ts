import { describe, expect, it } from 'vitest';
import { createSessionCookieOptions } from './session-cookie-options.js';

describe('createSessionCookieOptions', () => {
  it('keeps localhost sessions compatible with HTTP development', () => {
    expect(
      createSessionCookieOptions({ NODE_ENV: 'development', SESSION_COOKIE_SAME_SITE: 'lax' }),
    ).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
  });

  it('uses a secure cookie for Vercel and Render default domains', () => {
    expect(
      createSessionCookieOptions({ NODE_ENV: 'production', SESSION_COOKIE_SAME_SITE: 'none' }),
    ).toMatchObject({ httpOnly: true, sameSite: 'none', secure: true, path: '/' });
  });
});

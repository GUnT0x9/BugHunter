import { describe, expect, it } from 'vitest';
import { getTrustedWebOrigins, loadEnv } from './env.js';

const requiredEnvironment = {
  DATABASE_URL: 'postgresql://bughunter:bughunter@localhost:5432/bughunter',
  REDIS_URL: 'redis://localhost:6379',
};

describe('loadEnv', () => {
  it('uses local-safe deployment defaults', () => {
    expect(loadEnv(requiredEnvironment)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      SESSION_COOKIE_SAME_SITE: 'lax',
      WEB_ORIGIN: 'http://localhost:5173',
      WEB_ORIGINS:
        'https://debugrove.vercel.app,https://bughunter-web.vercel.app,https://codetrace-lab.vercel.app',
      JUDGE_PROVIDER: 'docker',
      JUDGE0_API_URL: 'https://ce.judge0.com',
    });
  });

  it('parses Render port and cross-site cookie settings', () => {
    expect(
      loadEnv({
        ...requiredEnvironment,
        NODE_ENV: 'production',
        PORT: '10000',
        SESSION_COOKIE_SAME_SITE: 'none',
        WEB_ORIGIN: 'https://bughunter.vercel.app',
      }),
    ).toMatchObject({
      NODE_ENV: 'production',
      PORT: 10_000,
      SESSION_COOKIE_SAME_SITE: 'none',
      WEB_ORIGIN: 'https://bughunter.vercel.app',
    });
  });

  it('rejects invalid service ports', () => {
    expect(() => loadEnv({ ...requiredEnvironment, PORT: '70000' })).toThrow(
      'Invalid environment: PORT',
    );
  });
});

describe('getTrustedWebOrigins', () => {
  it('combines, trims, normalizes, and deduplicates configured origins', () => {
    expect(
      getTrustedWebOrigins({
        WEB_ORIGIN: 'https://debugrove.vercel.app/',
        WEB_ORIGINS:
          ' https://debugrove.vercel.app, https://bughunter-web.vercel.app/path ,https://codetrace-lab.vercel.app ',
      }),
    ).toEqual([
      'https://debugrove.vercel.app',
      'https://bughunter-web.vercel.app',
      'https://codetrace-lab.vercel.app',
    ]);
  });

  it('uses the primary web origin when no additional origins are configured', () => {
    expect(
      getTrustedWebOrigins({
        WEB_ORIGIN: 'http://localhost:5173',
        WEB_ORIGINS: undefined,
      }),
    ).toEqual(['http://localhost:5173']);
  });
});

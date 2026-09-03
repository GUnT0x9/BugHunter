import { randomBytes } from 'node:crypto';
import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { loadEnv } from '../common/env.js';
import { AuthService } from './auth.service.js';

type GoogleClaims = {
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  aud?: string;
};

@Injectable()
export class GoogleAuthService {
  constructor(private readonly auth: AuthService) {}

  enabled(): boolean {
    const env = loadEnv();
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }

  createAuthorization(): { state: string; url: string } {
    const env = loadEnv();
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
      throw new ServiceUnavailableException('Google 로그인이 아직 설정되지 않았습니다.');
    const state = randomBytes(32).toString('base64url');
    const query = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: `${env.WEB_ORIGIN}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return { state, url: `https://accounts.google.com/o/oauth2/v2/auth?${query}` };
  }

  async exchange(code: string) {
    const env = loadEnv();
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
      throw new ServiceUnavailableException('Google 로그인이 아직 설정되지 않았습니다.');
    const redirectUri = `${env.WEB_ORIGIN}/api/auth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = (await tokenResponse.json()) as { id_token?: string };
    if (!tokenResponse.ok || !tokens.id_token)
      throw new BadGatewayException('Google 인증 토큰을 확인하지 못했습니다.');
    const infoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`,
    );
    const claims = (await infoResponse.json()) as GoogleClaims;
    if (
      !infoResponse.ok ||
      claims.aud !== env.GOOGLE_CLIENT_ID ||
      !claims.sub ||
      !claims.email ||
      ![true, 'true'].includes(claims.email_verified ?? false)
    )
      throw new BadGatewayException('검증된 Google 계정 정보를 받지 못했습니다.');
    return this.auth.loginWithGoogle({
      sub: claims.sub,
      email: claims.email,
      name: claims.name ?? claims.email.split('@')[0]!,
    });
  }
}

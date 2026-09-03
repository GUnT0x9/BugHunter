import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  LoginInputSchema,
  ProfileUpdateSchema,
  RegisterInputSchema,
  type User,
} from '@bughunter/contracts';
import { parseBody } from '../common/validation.js';
import { loadEnv } from '../common/env.js';
import { CurrentUser } from './current-user.decorator.js';
import { AuthService } from './auth.service.js';
import { SessionAuthGuard } from './session-auth.guard.js';
import { SessionService } from './session.service.js';
import { SESSION_COOKIE_NAME } from './session.constants.js';
import { createSessionCookieOptions } from './session-cookie-options.js';
import { GoogleAuthService } from './google-auth.service.js';

type RequestWithCookies = Request & { cookies?: Record<string, string> };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly google: GoogleAuthService,
  ) {}

  @Get('google/status')
  googleStatus(): { enabled: boolean } {
    return { enabled: this.google.enabled() };
  }

  @Get('google')
  googleLogin(@Res() response: Response): void {
    const { state, url } = this.google.createAuthorization();
    const env = loadEnv();
    response.cookie('debugrove_google_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1_000,
      path: '/api/auth/google/callback',
    });
    response.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() request: RequestWithCookies,
    @Res() response: Response,
  ): Promise<void> {
    const env = loadEnv();
    const storedState = request.cookies?.debugrove_google_state;
    response.clearCookie('debugrove_google_state', { path: '/api/auth/google/callback' });
    if (error || !code || !state || !storedState || state !== storedState) {
      response.redirect(`${env.WEB_ORIGIN}/?authError=google`);
      return;
    }
    try {
      const user = await this.google.exchange(code);
      response.cookie(
        SESSION_COOKIE_NAME,
        await this.sessions.create(user.id),
        createSessionCookieOptions(env),
      );
      response.redirect(env.WEB_ORIGIN);
    } catch {
      response.redirect(`${env.WEB_ORIGIN}/?authError=google`);
    }
  }

  @Post('register')
  async register(
    @Body() body: unknown,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<User> {
    const user = await this.auth.register(parseBody(RegisterInputSchema, body));
    await this.sessions.destroy(request.cookies?.[SESSION_COOKIE_NAME]);
    const sessionCookieOptions = createSessionCookieOptions(loadEnv());
    response.cookie(SESSION_COOKIE_NAME, await this.sessions.create(user.id), sessionCookieOptions);
    return user;
  }

  @Post('login')
  async login(
    @Body() body: unknown,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<User> {
    const user = await this.auth.login(parseBody(LoginInputSchema, body));
    await this.sessions.destroy(request.cookies?.[SESSION_COOKIE_NAME]);
    const sessionCookieOptions = createSessionCookieOptions(loadEnv());
    response.cookie(SESSION_COOKIE_NAME, await this.sessions.create(user.id), sessionCookieOptions);
    return user;
  }

  @Post('logout')
  async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    await this.sessions.destroy(request.cookies?.[SESSION_COOKIE_NAME]);
    const sessionCookieOptions = createSessionCookieOptions(loadEnv());
    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: sessionCookieOptions.sameSite,
      secure: sessionCookieOptions.secure,
      path: sessionCookieOptions.path,
    });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Patch('me')
  @UseGuards(SessionAuthGuard)
  updateProfile(@CurrentUser() user: User, @Body() body: unknown): Promise<User> {
    return this.auth.updateProfile(user.id, parseBody(ProfileUpdateSchema, body));
  }

  @Delete('me')
  @UseGuards(SessionAuthGuard)
  async deleteAccount(
    @CurrentUser() user: User,
    @Body() body: unknown,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    const { password } = parseBody(z.object({ password: z.string().min(8).max(128) }), body);
    await this.auth.deleteAccount(user.id, password);
    await this.sessions.destroy(request.cookies?.[SESSION_COOKIE_NAME]);
    const sessionCookieOptions = createSessionCookieOptions(loadEnv());
    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: sessionCookieOptions.sameSite,
      secure: sessionCookieOptions.secure,
      path: sessionCookieOptions.path,
    });
    return { ok: true };
  }
}

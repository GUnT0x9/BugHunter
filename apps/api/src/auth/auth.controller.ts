import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
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

type RequestWithCookies = Request & { cookies?: Record<string, string> };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

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
}

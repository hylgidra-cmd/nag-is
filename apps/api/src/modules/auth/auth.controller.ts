import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AuthSession, PublicUser } from '@nagis/shared-types';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from '@nagis/shared-validation';
import { zodBody } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, Public, RequestContext } from '../../common/decorators';
import { REFRESH_COOKIE, type AuthenticatedUser } from '../../common/auth/auth.types';
import { readCookie } from '../../common/auth/cookies';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UsersService } from '../users/users.service';

/** Request metadata recorded against sessions and audit entries. */
interface Meta {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

function readRefreshCookie(request: Request): string | undefined {
  return readCookie(request, REFRESH_COOKIE);
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Create a student account and start a session' })
  async register(
    @Body(zodBody(registerSchema)) input: RegisterInput,
    @RequestContext() meta: Meta,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    const { user, tokens } = await this.auth.register(input, meta);
    this.tokens.setAuthCookies(response, tokens);
    return { user, expiresIn: tokens.accessExpiresInSeconds };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Start a session' })
  async login(
    @Body(zodBody(loginSchema)) input: LoginInput,
    @RequestContext() meta: Meta,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    const { user, tokens } = await this.auth.login(input, meta);
    this.tokens.setAuthCookies(response, tokens);
    return { user, expiresIn: tokens.accessExpiresInSeconds };
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  async refresh(
    @Req() request: Request,
    @RequestContext() meta: Meta,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    try {
      const { user, tokens } = await this.auth.refresh(readRefreshCookie(request), meta);
      this.tokens.setAuthCookies(response, tokens);
      return { user, expiresIn: tokens.accessExpiresInSeconds };
    } catch (error) {
      // A dead refresh token should leave the browser clean, so the next page
      // load is simply anonymous instead of retrying forever.
      this.tokens.clearAuthCookies(response);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'End the current session' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(readRefreshCookie(request));
    this.tokens.clearAuthCookies(response);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Request a password reset link',
    description:
      'Always returns 202, whether or not the address is registered, so this endpoint cannot be used to enumerate accounts.',
  })
  async forgotPassword(
    @Body(zodBody(forgotPasswordSchema)) input: ForgotPasswordInput,
  ): Promise<{ accepted: true }> {
    await this.auth.forgotPassword(input);
    return { accepted: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Complete a password reset using an emailed token' })
  async resetPassword(
    @Body(zodBody(resetPasswordSchema)) input: ResetPasswordInput,
    @RequestContext() meta: Meta,
  ): Promise<void> {
    await this.auth.resetPassword(input, meta);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change the signed-in user password' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(changePasswordSchema)) input: ChangePasswordInput,
    @RequestContext() meta: Meta,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.changePassword(user.id, input, meta);
    // Changing a password revokes every session, including this one.
    this.tokens.clearAuthCookies(response);
  }

  @Get('me')
  @ApiOperation({ summary: 'The signed-in user' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.users.getPublicById(user.id);
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AppConfigService } from '../../config/app-config.service';
import { AppError, ErrorCode } from '../errors/app.error';
import { ACCESS_COOKIE, type AccessTokenPayload, type AuthenticatedUser } from '../auth/auth.types';
import { readCookie } from '../auth/cookies';
import { IS_PUBLIC_KEY, OPTIONAL_AUTH_KEY } from '../decorators';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Registered globally in AppModule, so **every** route requires a valid
 * access token unless it opts out with `@Public()` or `@OptionalAuth()`.
 *
 * Defaulting to closed means forgetting a guard produces a 401, not a data
 * leak.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handlers = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, handlers) ?? false;
    const isOptional =
      this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, handlers) ?? false;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);

    if (!token) {
      if (isPublic || isOptional) return true;
      throw AppError.unauthorized(ErrorCode.UNAUTHORIZED, 'Access token missing');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.auth.accessSecret,
      });
    } catch {
      // An expired or forged token on an optional route is treated as
      // anonymous rather than as an error, so a stale cookie cannot lock a
      // visitor out of a public course page.
      if (isPublic || isOptional) return true;
      throw AppError.unauthorized(ErrorCode.UNAUTHORIZED, 'Access token invalid or expired');
    }

    // A refresh token must never be accepted here.
    if (payload.typ !== 'access') {
      if (isPublic || isOptional) return true;
      throw AppError.unauthorized(ErrorCode.UNAUTHORIZED, 'Wrong token type');
    }

    request.user = { id: payload.sub, email: payload.email, role: payload.role };
    return true;
  }

  /**
   * Accepts the httpOnly cookie first (the browser path) and falls back to a
   * bearer header (scripts, Swagger "Try it out", integration tests).
   */
  private extractToken(request: Request): string | undefined {
    const fromCookie = readCookie(request, ACCESS_COOKIE);
    if (fromCookie) return fromCookie;

    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim() || undefined;

    return undefined;
  }
}

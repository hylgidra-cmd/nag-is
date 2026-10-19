import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import type { UserRole } from '@nagis/shared-types';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  type AccessTokenPayload,
  type RefreshTokenPayload,
} from '../../common/auth/auth.types';
import { generateOpaqueToken, hashToken } from '../../common/utils/tokens';
import { parseDurationMs } from '../../common/utils/duration';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresInSeconds: number;
}

interface TokenSubject {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Issues, rotates and revokes the session pair.
 *
 * Design:
 *  * The access token is a short-lived (15m) signed JWT — stateless, cheap
 *    to verify on every request.
 *  * The refresh token is long-lived and *stateful*: a row in RefreshToken
 *    holds only its SHA-256 digest, so it can be revoked server-side and a
 *    leaked database cannot be replayed as a session.
 *  * Refreshing rotates the token. Presenting an already-rotated token is
 *    treated as theft and revokes the whole family.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  private get accessTtlMs(): number {
    return parseDurationMs(this.config.auth.accessTtl);
  }

  private get refreshTtlMs(): number {
    return parseDurationMs(this.config.auth.refreshTtl);
  }

  get accessExpiresInSeconds(): number {
    return Math.floor(this.accessTtlMs / 1000);
  }

  /** Creates a new session: a fresh access JWT and a fresh refresh row. */
  async issue(
    user: TokenSubject,
    context: { ip?: string | undefined; userAgent?: string | undefined } = {},
  ): Promise<IssuedTokens> {
    const refreshToken = generateOpaqueToken();
    const row = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        ip: context.ip ?? null,
        userAgent: context.userAgent ?? null,
      },
      select: { id: true },
    });

    const accessToken = await this.signAccessToken(user);
    // The JWT binds the refresh row id so rotation can revoke exactly one
    // device rather than every session the user has.
    const signedRefresh = await this.signRefreshToken(user.id, row.id);

    // The composite the browser carries is "<rowId>.<secret>.<jwt>". The
    // database knows only the secret's digest; the JWT proves the pairing was
    // issued by us and carries the expiry. Refresh requires all three to
    // agree, so neither a stolen database row nor a forged JWT is enough.
    return {
      accessToken,
      refreshToken: `${row.id}.${refreshToken}.${signedRefresh}`,
      accessExpiresInSeconds: this.accessExpiresInSeconds,
    };
  }

  private async signAccessToken(user: TokenSubject): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      typ: 'access',
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.auth.accessSecret,
      // Seconds rather than the "15m" string: jsonwebtoken types the string
      // form as a template literal from `ms`, and a number is unambiguous.
      expiresIn: Math.floor(this.accessTtlMs / 1000),
    });
  }

  private async signRefreshToken(userId: string, jti: string): Promise<string> {
    const payload: RefreshTokenPayload = { sub: userId, jti, typ: 'refresh' };
    return this.jwt.signAsync(payload, {
      secret: this.config.auth.refreshSecret,
      expiresIn: Math.floor(this.refreshTtlMs / 1000),
    });
  }

  /**
   * Validates a presented refresh token and rotates it.
   *
   * Returns null for anything suspicious — unknown, expired, revoked, or
   * already rotated — so callers only have to distinguish "ok" from "sign in
   * again".
   */
  async rotate(
    presented: string,
    context: { ip?: string | undefined; userAgent?: string | undefined } = {},
  ): Promise<{ tokens: IssuedTokens; user: TokenSubject } | null> {
    const parts = presented.split('.');
    // The composite is "<rowId>.<secret>.<jwt header.payload.signature>".
    if (parts.length < 5) return null;

    const [rowId, secret, ...jwtParts] = parts;
    const jwtToken = jwtParts.join('.');
    if (!rowId || !secret) return null;

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(jwtToken, {
        secret: this.config.auth.refreshSecret,
      });
    } catch {
      return null;
    }

    if (payload.typ !== 'refresh' || payload.jti !== rowId) return null;

    const row = await this.prisma.refreshToken.findUnique({
      where: { id: rowId },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (!row || row.userId !== payload.sub) return null;
    if (row.tokenHash !== hashToken(secret)) return null;
    if (!row.user.isActive) return null;

    if (row.revokedAt) {
      // A revoked token being presented means the secret escaped. Revoke
      // every live session for this user rather than just this one.
      await this.revokeAllForUser(row.userId);
      return null;
    }

    if (row.expiresAt.getTime() <= Date.now()) return null;

    const subject: TokenSubject = {
      id: row.user.id,
      email: row.user.email,
      role: row.user.role,
    };

    const tokens = await this.issue(subject, context);

    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date(), replacedBy: tokens.refreshToken.split('.')[0] ?? null },
    });

    return { tokens, user: subject };
  }

  /** Revokes the single session represented by a presented refresh token. */
  async revoke(presented: string): Promise<void> {
    const rowId = presented.split('.')[0];
    if (!rowId) return;
    await this.prisma.refreshToken.updateMany({
      where: { id: rowId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Removes expired and long-revoked rows. Called by the auth controller's
   *  maintenance endpoint and safe to run repeatedly. */
  async pruneExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  /* ----------------------------------------------------------------------
   * Cookies
   * ------------------------------------------------------------------- */

  private cookieOptions(maxAgeMs: number) {
    const { cookieDomain, cookieSecure } = this.config.auth;
    return {
      httpOnly: true,
      secure: cookieSecure,
      // "lax" still sends the cookie on top-level navigations, which is what
      // a link into the dashboard needs, while blocking cross-site POSTs.
      sameSite: 'lax' as const,
      path: '/',
      maxAge: maxAgeMs,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };
  }

  setAuthCookies(response: Response, tokens: IssuedTokens): void {
    response.cookie(ACCESS_COOKIE, tokens.accessToken, this.cookieOptions(this.accessTtlMs));
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.cookieOptions(this.refreshTtlMs),
      // The refresh cookie is only ever needed by the refresh and logout
      // routes, so it is not sent on every API call.
      path: '/api/v1/auth',
    });
  }

  clearAuthCookies(response: Response): void {
    const { cookieDomain, cookieSecure } = this.config.auth;
    const base = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax' as const,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };
    response.clearCookie(ACCESS_COOKIE, { ...base, path: '/' });
    response.clearCookie(REFRESH_COOKIE, { ...base, path: '/api/v1/auth' });
  }
}

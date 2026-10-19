import type { UserRole } from '@nagis/shared-types';

/** Claims carried by an access token. */
export interface AccessTokenPayload {
  /** User id. */
  sub: string;
  email: string;
  role: UserRole;
  /** Token kind, so a refresh token can never be replayed as an access token. */
  typ: 'access';
  iat?: number;
  exp?: number;
}

/** Claims carried by a refresh token. */
export interface RefreshTokenPayload {
  sub: string;
  /** Opaque id of the RefreshToken row, so rotation can revoke precisely. */
  jti: string;
  typ: 'refresh';
  iat?: number;
  exp?: number;
}

/** What guards attach to the request. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export const ACCESS_COOKIE = 'nagis_at';
export const REFRESH_COOKIE = 'nagis_rt';

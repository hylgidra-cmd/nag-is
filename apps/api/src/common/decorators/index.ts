import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRole } from '@nagis/shared-types';
import { AppError } from '../errors/app.error';
import type { AuthenticatedUser } from '../auth/auth.types';

export const IS_PUBLIC_KEY = 'nagis:isPublic';
export const ROLES_KEY = 'nagis:roles';
export const OPTIONAL_AUTH_KEY = 'nagis:optionalAuth';

/**
 * Marks a route as reachable without authentication.
 *
 * The access-token guard is registered globally, so routes are private by
 * default and opening one up is an explicit, reviewable act.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Public route that still resolves the caller when a valid token is present.
 *
 * Used by course pages, which are visible to anyone but show enrollment state
 * and unlocked lessons to a signed-in student.
 */
export const OptionalAuth = (): MethodDecorator & ClassDecorator =>
  SetMetadata(OPTIONAL_AUTH_KEY, true);

/** Restricts a route to the listed roles. Enforced server-side by RolesGuard. */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Injects the authenticated user. Throws if the route reached a handler
 * without one, which would mean a guard was misconfigured rather than that
 * the caller is anonymous.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw AppError.unauthorized();
    }
    return request.user;
  },
);

/** Injects the authenticated user, or undefined on an @OptionalAuth route. */
export const MaybeUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    return ctx.switchToHttp().getRequest<RequestWithUser>().user;
  },
);

/** Client IP and user agent, for audit logs and refresh-token records. */
export const RequestContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { ip?: string; userAgent?: string } => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const agent = request.headers['user-agent'];
    return {
      ...(request.ip ? { ip: request.ip } : {}),
      ...(typeof agent === 'string' ? { userAgent: agent } : {}),
    };
  },
);

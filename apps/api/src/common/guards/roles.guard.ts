import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '@nagis/shared-types';
import { AppError, ErrorCode } from '../errors/app.error';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ROLES_KEY } from '../decorators';

/**
 * Server-side role enforcement.
 *
 * Hiding an admin link in the frontend is presentation, not security — this
 * guard is what actually keeps a student out of /admin endpoints.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) throw AppError.unauthorized();

    if (!required.includes(user.role)) {
      throw AppError.forbidden(
        ErrorCode.FORBIDDEN,
        `Requires one of: ${required.join(', ')}`,
      );
    }

    return true;
  }
}

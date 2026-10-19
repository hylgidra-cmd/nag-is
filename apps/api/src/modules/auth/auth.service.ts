import { Injectable, Logger } from '@nestjs/common';
import type { PublicUser } from '@nagis/shared-types';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@nagis/shared-validation';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError, ErrorCode } from '../../common/errors/app.error';
import { generateOpaqueToken, hashToken } from '../../common/utils/tokens';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { toPublicUser } from '../users/user.mapper';
import { PasswordService } from './password.service';
import { TokenService, type IssuedTokens } from './token.service';

/** How long a password-reset link stays usable. */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface RequestMeta {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {}

  async register(
    input: RegisterInput,
    meta: RequestMeta,
  ): Promise<{ user: PublicUser; tokens: IssuedTokens }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existing) {
      throw AppError.conflict(ErrorCode.EMAIL_TAKEN, 'Email address is already registered');
    }

    const passwordHash = await this.passwords.hash(input.password);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        // Roles are never taken from the request body. A new account is
        // always a STUDENT; elevation happens only through the admin API.
        role: 'STUDENT',
      },
    });

    const tokens = await this.tokens.issue(
      { id: user.id, email: user.email, role: user.role },
      meta,
    );

    await this.audit.record({
      actorId: user.id,
      action: 'auth.register',
      entityType: 'User',
      entityId: user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return { user: toPublicUser(user), tokens };
  }

  async login(
    input: LoginInput,
    meta: RequestMeta,
  ): Promise<{ user: PublicUser; tokens: IssuedTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    if (!user) {
      // Spend comparable CPU so response timing does not reveal whether the
      // address exists, then return the same error as a wrong password.
      await this.passwords.spendDummyWork();
      throw AppError.unauthorized(ErrorCode.INVALID_CREDENTIALS, 'Email or password is incorrect');
    }

    const valid = await this.passwords.verify(input.password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized(ErrorCode.INVALID_CREDENTIALS, 'Email or password is incorrect');
    }

    if (!user.isActive) {
      throw AppError.forbidden(ErrorCode.ACCOUNT_DISABLED, 'This account has been disabled');
    }

    const tokens = await this.tokens.issue(
      { id: user.id, email: user.email, role: user.role },
      meta,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user: toPublicUser(user), tokens };
  }

  async refresh(
    presented: string | undefined,
    meta: RequestMeta,
  ): Promise<{ user: PublicUser; tokens: IssuedTokens }> {
    if (!presented) {
      throw AppError.unauthorized(ErrorCode.INVALID_REFRESH_TOKEN, 'Refresh token missing');
    }

    const rotated = await this.tokens.rotate(presented, meta);
    if (!rotated) {
      throw AppError.unauthorized(
        ErrorCode.INVALID_REFRESH_TOKEN,
        'Refresh token is invalid, expired or already used',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: rotated.user.id } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized(ErrorCode.ACCOUNT_DISABLED, 'This account has been disabled');
    }

    return { user: toPublicUser(user), tokens: rotated.tokens };
  }

  async logout(presented: string | undefined): Promise<void> {
    if (presented) await this.tokens.revoke(presented);
  }

  /**
   * Starts the reset flow.
   *
   * Always resolves successfully, whether or not the address is registered:
   * a differentiated response here would turn the endpoint into an account
   * enumeration oracle.
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, fullName: true, isActive: true },
    });

    if (!user || !user.isActive) {
      this.logger.log(`Password reset requested for an unknown or disabled address`);
      return;
    }

    // Invalidate any outstanding links so only the newest one works.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = generateOpaqueToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    await this.mail.sendPasswordReset({
      to: user.email,
      fullName: user.fullName,
      token,
    });
  }

  async resetPassword(input: ResetPasswordInput, meta: RequestMeta): Promise<void> {
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(input.token) },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now() || !row.user.isActive) {
      throw AppError.badRequest(
        ErrorCode.INVALID_RESET_TOKEN,
        'This reset link is invalid or has expired',
      );
    }

    const passwordHash = await this.passwords.hash(input.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // A password change ends every existing session, so a thief who already
    // holds a refresh token loses access.
    await this.tokens.revokeAllForUser(row.userId);

    await this.audit.record({
      actorId: row.userId,
      action: 'auth.password_reset',
      entityType: 'User',
      entityId: row.userId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    meta: RequestMeta,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) throw AppError.notFound(ErrorCode.USER_NOT_FOUND, 'User not found');

    const valid = await this.passwords.verify(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw AppError.badRequest(
        ErrorCode.CURRENT_PASSWORD_WRONG,
        'The current password is incorrect',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await this.passwords.hash(input.newPassword) },
    });

    await this.tokens.revokeAllForUser(userId);

    await this.audit.record({
      actorId: userId,
      action: 'auth.password_change',
      entityType: 'User',
      entityId: userId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }
}

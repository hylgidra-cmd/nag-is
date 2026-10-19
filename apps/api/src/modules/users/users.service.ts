import { Injectable } from '@nestjs/common';
import type { Paginated, PublicUser } from '@nagis/shared-types';
import type {
  AdminUpdateUserInput,
  AdminUserQueryInput,
  UpdateProfileInput,
} from '@nagis/shared-validation';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError, ErrorCode } from '../../common/errors/app.error';
import { paginate, toSkipTake } from '../../common/utils/pagination';
import { AuditService } from '../audit/audit.service';
import { toPublicUser } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getPublicById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound(ErrorCode.USER_NOT_FOUND, 'User not found');
    return toPublicUser(user);
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: input.fullName,
        headline: input.headline ?? null,
        bio: input.bio ?? null,
      },
    });
    return toPublicUser(user);
  }

  /* --------------------------------------------------------------------
   * Admin
   * ----------------------------------------------------------------- */

  async listForAdmin(query: AdminUserQueryInput): Promise<Paginated<PublicUser & {
    isActive: boolean;
    enrollmentCount: number;
    lastLoginAt: string | null;
  }>> {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: 'insensitive' as const } },
              { email: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(query),
        include: { _count: { select: { enrollments: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(
      rows.map((row) => ({
        ...toPublicUser(row),
        isActive: row.isActive,
        enrollmentCount: row._count.enrollments,
        lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      })),
      total,
      query,
    );
  }

  async updateByAdmin(
    actorId: string,
    targetId: string,
    input: AdminUpdateUserInput,
    meta: { ip?: string | undefined; userAgent?: string | undefined },
  ): Promise<PublicUser> {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, isActive: true },
    });
    if (!target) throw AppError.notFound(ErrorCode.USER_NOT_FOUND, 'User not found');

    // An admin must not be able to strip their own privileges or lock
    // themselves out, which could leave the platform with no administrator.
    if (actorId === targetId) {
      if (input.role && input.role !== 'ADMIN') {
        throw AppError.badRequest(
          'CANNOT_DEMOTE_SELF',
          'You cannot change your own role',
        );
      }
      if (input.isActive === false) {
        throw AppError.badRequest(
          'CANNOT_DISABLE_SELF',
          'You cannot disable your own account',
        );
      }
    }

    // Removing the last administrator would make the admin panel
    // unreachable, so it is refused.
    if (target.role === 'ADMIN' && input.role && input.role !== 'ADMIN') {
      const admins = await this.prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (admins <= 1) {
        throw AppError.badRequest(
          'LAST_ADMIN',
          'Cannot remove the last active administrator',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: {
        ...(input.role ? { role: input.role } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.fullName ? { fullName: input.fullName } : {}),
      },
    });

    await this.audit.record({
      actorId,
      action: 'admin.user_update',
      entityType: 'User',
      entityId: targetId,
      metadata: {
        ...(input.role ? { role: { from: target.role, to: input.role } } : {}),
        ...(input.isActive !== undefined
          ? { isActive: { from: target.isActive, to: input.isActive } }
          : {}),
      },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return toPublicUser(updated);
  }
}

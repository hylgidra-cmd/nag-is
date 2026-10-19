import { Injectable } from '@nestjs/common';
import type { CategoryDto } from '@nagis/shared-types';
import type { CategoryUpdateInput, CategoryUpsertInput } from '@nagis/shared-validation';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError, ErrorCode } from '../../common/errors/app.error';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Public category list.
   *
   * `courseCount` counts only PUBLISHED courses, so a category whose courses
   * are all drafts shows 0 rather than advertising content nobody can open.
   */
  async listPublic(): Promise<CategoryDto[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { courses: { where: { status: 'PUBLISHED' } } } },
      },
    });

    return rows.map((row) => this.toDto(row, row._count.courses));
  }

  /** Admin list: includes inactive categories and counts every course. */
  async listForAdmin(): Promise<CategoryDto[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { courses: true } } },
    });
    return rows.map((row) => this.toDto(row, row._count.courses));
  }

  async getBySlug(slug: string): Promise<CategoryDto> {
    const row = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: { select: { courses: { where: { status: 'PUBLISHED' } } } },
      },
    });
    if (!row) throw AppError.notFound(ErrorCode.CATEGORY_NOT_FOUND, 'Category not found');
    return this.toDto(row, row._count.courses);
  }

  async create(
    actorId: string,
    input: CategoryUpsertInput,
    meta: { ip?: string | undefined; userAgent?: string | undefined },
  ): Promise<CategoryDto> {
    const clash = await this.prisma.category.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (clash) {
      throw AppError.conflict(ErrorCode.CATEGORY_SLUG_TAKEN, 'This slug is already in use');
    }

    const row = await this.prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        icon: input.icon ?? null,
        accent: input.accent ?? null,
        position: input.position,
      },
      include: { _count: { select: { courses: true } } },
    });

    await this.audit.record({
      actorId,
      action: 'admin.category_create',
      entityType: 'Category',
      entityId: row.id,
      metadata: { slug: row.slug, name: row.name },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return this.toDto(row, row._count.courses);
  }

  async update(
    actorId: string,
    id: string,
    input: CategoryUpdateInput,
    meta: { ip?: string | undefined; userAgent?: string | undefined },
  ): Promise<CategoryDto> {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) throw AppError.notFound(ErrorCode.CATEGORY_NOT_FOUND, 'Category not found');

    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.prisma.category.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });
      if (clash) {
        throw AppError.conflict(ErrorCode.CATEGORY_SLUG_TAKEN, 'This slug is already in use');
      }
    }

    const row = await this.prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(input.icon !== undefined ? { icon: input.icon ?? null } : {}),
        ...(input.accent !== undefined ? { accent: input.accent ?? null } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
      },
      include: { _count: { select: { courses: true } } },
    });

    await this.audit.record({
      actorId,
      action: 'admin.category_update',
      entityType: 'Category',
      entityId: id,
      metadata: { changed: Object.keys(input) },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return this.toDto(row, row._count.courses);
  }

  /**
   * Deletes a category.
   *
   * The Course -> Category relation is `onDelete: Restrict`, so this is
   * refused while any course still points at it. Checking first lets us
   * return a precise error instead of a raw constraint violation.
   */
  async remove(
    actorId: string,
    id: string,
    meta: { ip?: string | undefined; userAgent?: string | undefined },
  ): Promise<void> {
    const row = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    });
    if (!row) throw AppError.notFound(ErrorCode.CATEGORY_NOT_FOUND, 'Category not found');

    if (row._count.courses > 0) {
      throw AppError.conflict(
        ErrorCode.CATEGORY_NOT_EMPTY,
        `This category still has ${row._count.courses} course(s). Move or delete them first.`,
      );
    }

    await this.prisma.category.delete({ where: { id } });

    await this.audit.record({
      actorId,
      action: 'admin.category_delete',
      entityType: 'Category',
      entityId: id,
      metadata: { slug: row.slug, name: row.name },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  private toDto(
    row: {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      icon: string | null;
      accent: string | null;
      position: number;
    },
    courseCount: number,
  ): CategoryDto {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      icon: row.icon,
      accent: row.accent,
      position: row.position,
      courseCount,
    };
  }
}

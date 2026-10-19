import { Injectable } from '@nestjs/common';
import type { AdminOverview, CourseDetail, OrderDto } from '@nagis/shared-types';
import type {
  AdminCourseQueryInput,
  CourseCreateInput,
  CourseUpdateInput,
  LessonCreateInput,
  LessonUpdateInput,
  ModuleCreateInput,
  ModuleUpdateInput,
  ReorderInput,
} from '@nagis/shared-validation';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError, ErrorCode } from '../../common/errors/app.error';
import { paginate, toSkipTake } from '../../common/utils/pagination';
import { dayKey, daysAgo, lastNDays } from '../../common/utils/duration';
import { courseListSelect, toCourseListItem } from '../courses/course.mapper';
import { AuditService } from '../audit/audit.service';

interface Actor {
  id: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
}

/** Days covered by the overview trend charts. */
const TREND_DAYS = 30;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /* ====================================================================
   * Overview
   * ================================================================= */

  /**
   * Platform totals and 30-day trends.
   *
   * Revenue counts only PAID orders, summed from the price snapshot on each
   * OrderItem rather than the course's current price — a later price change
   * must not retroactively alter reported revenue.
   */
  async overview(): Promise<AdminOverview> {
    const since = daysAgo(TREND_DAYS - 1);

    const [
      users,
      students,
      instructors,
      courses,
      publishedCourses,
      draftCourses,
      categories,
      enrollments,
      certificates,
      paidOrders,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.course.count({ where: { status: 'DRAFT' } }),
      this.prisma.category.count(),
      this.prisma.enrollment.count({ where: { status: { not: 'CANCELLED' } } }),
      this.prisma.certificate.count(),
      this.prisma.order.count({ where: { status: 'PAID' } }),
    ]);

    const revenueAggregate = await this.prisma.order.aggregate({
      where: { status: 'PAID' },
      _sum: { totalUzs: true },
    });

    /* ---- Trends, zero-filled over the window ---- */
    const [enrollmentRows, paidOrderRows] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where: { enrolledAt: { gte: since }, status: { not: 'CANCELLED' } },
        select: { enrolledAt: true },
      }),
      this.prisma.order.findMany({
        where: { status: 'PAID', paidAt: { gte: since } },
        select: { paidAt: true, totalUzs: true },
      }),
    ]);

    const days = lastNDays(TREND_DAYS);
    const enrollmentBuckets = new Map(days.map((day) => [day, 0]));
    const revenueBuckets = new Map(days.map((day) => [day, 0]));

    for (const row of enrollmentRows) {
      const key = dayKey(row.enrolledAt);
      const current = enrollmentBuckets.get(key);
      if (current !== undefined) enrollmentBuckets.set(key, current + 1);
    }

    for (const row of paidOrderRows) {
      if (!row.paidAt) continue;
      const key = dayKey(row.paidAt);
      const current = revenueBuckets.get(key);
      if (current !== undefined) revenueBuckets.set(key, current + row.totalUzs);
    }

    /* ---- Top courses by enrollment, with their real revenue ---- */
    const topCourseRows = await this.prisma.course.findMany({
      orderBy: { enrollmentCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        enrollmentCount: true,
        orderItems: {
          where: { order: { status: 'PAID' } },
          select: { unitPriceUzs: true },
        },
      },
    });

    return {
      totals: {
        users,
        students,
        instructors,
        courses,
        publishedCourses,
        draftCourses,
        categories,
        enrollments,
        certificates,
        paidOrders,
        revenueUzs: revenueAggregate._sum.totalUzs ?? 0,
      },
      enrollmentTrend: [...enrollmentBuckets.entries()].map(([date, count]) => ({ date, count })),
      revenueTrend: [...revenueBuckets.entries()].map(([date, revenueUzs]) => ({
        date,
        revenueUzs,
      })),
      topCourses: topCourseRows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        enrollments: row.enrollmentCount,
        revenueUzs: row.orderItems.reduce((sum, item) => sum + item.unitPriceUzs, 0),
      })),
      recentOrders: await this.recentOrders(),
    };
  }

  private async recentOrders(): Promise<OrderDto[]> {
    const rows = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return rows.map((row) => this.toOrderDto(row));
  }

  /* ====================================================================
   * Courses
   * ================================================================= */

  /** Admin course list: includes drafts and archived courses. */
  async listCourses(query: AdminCourseQueryInput) {
    const where: Prisma.CourseWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' as const } },
              { slug: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        ...toSkipTake(query),
        select: { ...courseListSelect, status: true, updatedAt: true },
      }),
      this.prisma.course.count({ where }),
    ]);

    return paginate(
      rows.map((row) => ({
        ...toCourseListItem(row),
        status: row.status,
        updatedAt: row.updatedAt.toISOString(),
      })),
      total,
      query,
    );
  }

  async createCourse(actor: Actor, input: CourseCreateInput): Promise<CourseDetail> {
    await this.assertCategoryExists(input.categoryId);

    const slugTaken = await this.prisma.course.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (slugTaken) {
      throw AppError.conflict(ErrorCode.COURSE_SLUG_TAKEN, 'This slug is already in use');
    }

    // The instructor defaults to the acting admin when not specified, and is
    // validated when it is — a client cannot attribute a course to a
    // non-existent or non-teaching account.
    const instructorId = input.instructorId ?? actor.id;
    await this.assertInstructorExists(instructorId);

    const created = await this.prisma.course.create({
      data: {
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        description: input.description,
        categoryId: input.categoryId,
        instructorId,
        level: input.level,
        status: input.status,
        priceUzs: input.priceUzs,
        comparePriceUzs: input.comparePriceUzs ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        promoVideoUrl: input.promoVideoUrl ?? null,
        language: input.language,
        objectives: input.objectives,
        prerequisites: input.prerequisites,
        targetAudience: input.targetAudience,
        // publishedAt is only set when the course actually goes live.
        publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      },
      select: { id: true, slug: true },
    });

    await this.audit.record({
      actorId: actor.id,
      action: 'admin.course_create',
      entityType: 'Course',
      entityId: created.id,
      metadata: { slug: created.slug, status: input.status },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return this.getCourseForAdmin(created.id);
  }

  async updateCourse(
    actor: Actor,
    id: string,
    input: CourseUpdateInput,
  ): Promise<CourseDetail> {
    const existing = await this.prisma.course.findUnique({
      where: { id },
      select: { id: true, slug: true, status: true, publishedAt: true },
    });
    if (!existing) throw AppError.notFound(ErrorCode.COURSE_NOT_FOUND, 'Course not found');

    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.prisma.course.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });
      if (clash) {
        throw AppError.conflict(ErrorCode.COURSE_SLUG_TAKEN, 'This slug is already in use');
      }
    }

    if (input.categoryId) await this.assertCategoryExists(input.categoryId);
    if (input.instructorId) await this.assertInstructorExists(input.instructorId);

    // First publish stamps publishedAt; later edits keep the original date so
    // "newest" ordering does not reshuffle on every save.
    const becomingPublished = input.status === 'PUBLISHED' && existing.status !== 'PUBLISHED';

    const updated = await this.prisma.course.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.instructorId !== undefined ? { instructorId: input.instructorId } : {}),
        ...(input.level !== undefined ? { level: input.level } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priceUzs !== undefined ? { priceUzs: input.priceUzs } : {}),
        ...(input.comparePriceUzs !== undefined
          ? { comparePriceUzs: input.comparePriceUzs ?? null }
          : {}),
        ...(input.thumbnailUrl !== undefined
          ? { thumbnailUrl: input.thumbnailUrl ?? null }
          : {}),
        ...(input.promoVideoUrl !== undefined
          ? { promoVideoUrl: input.promoVideoUrl ?? null }
          : {}),
        ...(input.language !== undefined ? { language: input.language } : {}),
        ...(input.objectives !== undefined ? { objectives: input.objectives } : {}),
        ...(input.prerequisites !== undefined ? { prerequisites: input.prerequisites } : {}),
        ...(input.targetAudience !== undefined ? { targetAudience: input.targetAudience } : {}),
        ...(becomingPublished && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      },
      select: { id: true },
    });

    await this.audit.record({
      actorId: actor.id,
      action: input.status !== undefined ? 'admin.course_status_change' : 'admin.course_update',
      entityType: 'Course',
      entityId: id,
      metadata: {
        changed: Object.keys(input),
        ...(input.status !== undefined
          ? { status: { from: existing.status, to: input.status } }
          : {}),
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return this.getCourseForAdmin(updated.id);
  }

  /**
   * Deletes a course.
   *
   * Refused once anyone has enrolled or purchased: OrderItem holds a Restrict
   * foreign key to preserve receipts, and removing a course people paid for
   * would destroy their access. Archiving is the correct action instead.
   */
  async deleteCourse(actor: Actor, id: string): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        _count: { select: { enrollments: true, orderItems: true, certificates: true } },
      },
    });
    if (!course) throw AppError.notFound(ErrorCode.COURSE_NOT_FOUND, 'Course not found');

    const { enrollments, orderItems, certificates } = course._count;
    if (enrollments > 0 || orderItems > 0 || certificates > 0) {
      throw AppError.conflict(
        'COURSE_IN_USE',
        `This course has ${enrollments} enrollment(s), ${orderItems} order item(s) and ` +
          `${certificates} certificate(s). Archive it instead of deleting.`,
      );
    }

    await this.prisma.course.delete({ where: { id } });

    await this.audit.record({
      actorId: actor.id,
      action: 'admin.course_delete',
      entityType: 'Course',
      entityId: id,
      metadata: { slug: course.slug },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  }

  /* ====================================================================
   * Modules & lessons
   * ================================================================= */

  async createModule(actor: Actor, input: ModuleCreateInput) {
    const course = await this.prisma.course.findUnique({
      where: { id: input.courseId },
      select: { id: true },
    });
    if (!course) throw AppError.notFound(ErrorCode.COURSE_NOT_FOUND, 'Course not found');

    // Append to the end unless an explicit position was given.
    const position = input.position ?? (await this.nextModulePosition(input.courseId));

    const created = await this.prisma.courseModule.create({
      data: {
        courseId: input.courseId,
        title: input.title,
        description: input.description ?? null,
        position,
      },
    });

    await this.audit.record({
      actorId: actor.id,
      action: 'admin.module_create',
      entityType: 'CourseModule',
      entityId: created.id,
      metadata: { courseId: input.courseId, title: input.title },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return created;
  }

  async updateModule(actor: Actor, id: string, input: ModuleUpdateInput) {
    const existing = await this.prisma.courseModule.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw AppError.notFound(ErrorCode.MODULE_NOT_FOUND, 'Module not found');

    const updated = await this.prisma.courseModule.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
      },
    });

    await this.audit.record({
      actorId: actor.id,
      action: 'admin.module_update',
      entityType: 'CourseModule',
      entityId: id,
      metadata: { changed: Object.keys(input) },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return updated;
  }

  async deleteModule(actor: Actor, id: string): Promise<void> {
    const existing = await this.prisma.courseModule.findUnique({
      where: { id },
      select: { id: true, title: true, _count: { select: { lessons: true } } },
    });
    if (!existing) throw AppError.notFound(ErrorCode.MODULE_NOT_FOUND, 'Module not found');

    // Lessons cascade, and their progress rows with them. That is acceptable
    // for a module the administrator is deliberately removing, but it is
    // recorded so the deletion is traceable.
    await this.prisma.courseModule.delete({ where: { id } });

    await this.audit.record({
      actorId: actor.id,
      action: 'admin.module_delete',
      entityType: 'CourseModule',
      entityId: id,
      metadata: { title: existing.title, cascadedLessons: existing._count.lessons },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  }

  async createLesson(actor: Actor, input: LessonCreateInput) {
    const courseModule = await this.prisma.courseModule.findUnique({
      where: { id: input.moduleId },
      select: { id: true, courseId: true },
    });
    if (!courseModule) throw AppError.notFound(ErrorCode.MODULE_NOT_FOUND, 'Module not found');

    const slugTaken = await this.prisma.lesson.findUnique({
      where: { moduleId_slug: { moduleId: input.moduleId, slug: input.slug } },
      select: { id: true },
    });
    if (slugTaken) {
      throw AppError.conflict(
        ErrorCode.LESSON_SLUG_TAKEN,
        'A lesson with this slug already exists in the module',
      );
    }

    const position = input.position ?? (await this.nextLessonPosition(input.moduleId));

    const created = await this.prisma.lesson.create({
      data: {
        moduleId: input.moduleId,
        title: input.title,
        slug: input.slug,
        type: input.type,
        description: input.description ?? null,
        content: input.content ?? null,
        videoRef: input.videoRef ?? null,
        durationMinutes: input.durationMinutes,
        position,
        isPreview: input.isPreview,
        isPublished: input.isPublished,
      },
      select: { id: true, title: true, slug: true, position: true },
    });

    await this.audit.record({
      actorId: actor.id,
      action: 'admin.lesson_create',
      entityType: 'Lesson',
      entityId: created.id,
      metadata: { moduleId: input.moduleId, title: input.title },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return created;
  }

  async updateLesson(actor: Actor, id: string, input: LessonUpdateInput) {
    const existing = await this.prisma.lesson.findUnique({
      where: { id },
      select: { id: true, moduleId: true, slug: true },
    });
    if (!existing) throw AppError.notFound(ErrorCode.LESSON_NOT_FOUND, 'Lesson not found');

    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.prisma.lesson.findUnique({
        where: { moduleId_slug: { moduleId: existing.moduleId, slug: input.slug } },
        select: { id: true },
      });
      if (clash) {
        throw AppError.conflict(
          ErrorCode.LESSON_SLUG_TAKEN,
          'A lesson with this slug already exists in the module',
        );
      }
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(input.content !== undefined ? { content: input.content ?? null } : {}),
        ...(input.videoRef !== undefined ? { videoRef: input.videoRef ?? null } : {}),
        ...(input.durationMinutes !== undefined
          ? { durationMinutes: input.durationMinutes }
          : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
        ...(input.isPreview !== undefined ? { isPreview: input.isPreview } : {}),
        ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
      },
      select: { id: true, title: true, slug: true, position: true },
    });

    await this.audit.record({
      actorId: actor.id,
      action: 'admin.lesson_update',
      entityType: 'Lesson',
      entityId: id,
      metadata: { changed: Object.keys(input) },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return updated;
  }

  async deleteLesson(actor: Actor, id: string): Promise<void> {
    const existing = await this.prisma.lesson.findUnique({
      where: { id },
      select: { id: true, title: true, _count: { select: { progress: true } } },
    });
    if (!existing) throw AppError.notFound(ErrorCode.LESSON_NOT_FOUND, 'Lesson not found');

    await this.prisma.lesson.delete({ where: { id } });

    await this.audit.record({
      actorId: actor.id,
      action: 'admin.lesson_delete',
      entityType: 'Lesson',
      entityId: id,
      metadata: { title: existing.title, cascadedProgress: existing._count.progress },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  }

  /**
   * Reorders modules or lessons.
   *
   * Positions are rewritten in one transaction so a partial failure cannot
   * leave two siblings claiming the same slot.
   */
  async reorderModules(actor: Actor, courseId: string, input: ReorderInput): Promise<void> {
    const owned = await this.prisma.courseModule.findMany({
      where: { courseId },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((row) => row.id));

    // Every id must belong to this course, or an administrator could reorder
    // another course's modules by id.
    for (const id of input.ids) {
      if (!ownedIds.has(id)) {
        throw AppError.badRequest('REORDER_MISMATCH', 'Module does not belong to this course');
      }
    }

    await this.prisma.$transaction(
      input.ids.map((id, index) =>
        this.prisma.courseModule.update({ where: { id }, data: { position: index } }),
      ),
    );

    await this.audit.record({
      actorId: actor.id,
      action: 'admin.module_reorder',
      entityType: 'Course',
      entityId: courseId,
      metadata: { count: input.ids.length },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  }

  async reorderLessons(actor: Actor, moduleId: string, input: ReorderInput): Promise<void> {
    const owned = await this.prisma.lesson.findMany({
      where: { moduleId },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((row) => row.id));

    for (const id of input.ids) {
      if (!ownedIds.has(id)) {
        throw AppError.badRequest('REORDER_MISMATCH', 'Lesson does not belong to this module');
      }
    }

    await this.prisma.$transaction(
      input.ids.map((id, index) =>
        this.prisma.lesson.update({ where: { id }, data: { position: index } }),
      ),
    );

    await this.audit.record({
      actorId: actor.id,
      action: 'admin.lesson_reorder',
      entityType: 'CourseModule',
      entityId: moduleId,
      metadata: { count: input.ids.length },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  }

  /* ====================================================================
   * Orders
   * ================================================================= */

  async listOrders(query: { page: number; perPage: number; status?: string }) {
    const where: Prisma.OrderWhereInput = query.status
      ? { status: query.status as Prisma.EnumOrderStatusFilter['equals'] }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(query),
        include: {
          items: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
          user: { select: { fullName: true, email: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(
      rows.map((row) => ({
        ...this.toOrderDto(row),
        customerName: row.user.fullName,
        customerEmail: row.user.email,
      })),
      total,
      query,
    );
  }

  /* ====================================================================
   * Helpers
   * ================================================================= */

  /** Full course payload for the admin editor, including drafts. */
  async getCourseForAdmin(id: string): Promise<CourseDetail> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: {
        ...courseListSelect,
        description: true,
        objectives: true,
        prerequisites: true,
        targetAudience: true,
        status: true,
        modules: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            position: true,
            lessons: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                slug: true,
                title: true,
                type: true,
                durationMinutes: true,
                position: true,
                isPreview: true,
                isPublished: true,
                quiz: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!course) throw AppError.notFound(ErrorCode.COURSE_NOT_FOUND, 'Course not found');

    return {
      ...toCourseListItem(course),
      description: course.description,
      objectives: course.objectives,
      prerequisites: course.prerequisites,
      targetAudience: course.targetAudience,
      status: course.status,
      modules: course.modules.map((courseModule) => ({
        id: courseModule.id,
        title: courseModule.title,
        description: courseModule.description,
        position: courseModule.position,
        durationMinutes: courseModule.lessons.reduce(
          (sum, lesson) => sum + lesson.durationMinutes,
          0,
        ),
        lessons: courseModule.lessons.map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          type: lesson.type,
          durationMinutes: lesson.durationMinutes,
          position: lesson.position,
          isPreview: lesson.isPreview,
          // An administrator sees every lesson regardless of publication.
          isAccessible: true,
          hasQuiz: lesson.quiz !== null,
        })),
      })),
      reviews: [],
      viewerEnrollment: null,
      viewerHasReviewed: false,
      viewerSaved: false,
    };
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw AppError.badRequest(ErrorCode.CATEGORY_NOT_FOUND, 'Category not found');
    }
  }

  private async assertInstructorExists(instructorId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw AppError.badRequest(ErrorCode.USER_NOT_FOUND, 'Instructor not found');
    }
    if (user.role === 'STUDENT') {
      throw AppError.badRequest(
        'NOT_AN_INSTRUCTOR',
        'This user is a student; grant the INSTRUCTOR role first',
      );
    }
  }

  private async nextModulePosition(courseId: string): Promise<number> {
    const last = await this.prisma.courseModule.findFirst({
      where: { courseId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return last ? last.position + 1 : 0;
  }

  private async nextLessonPosition(moduleId: string): Promise<number> {
    const last = await this.prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return last ? last.position + 1 : 0;
  }

  private toOrderDto(row: {
    id: string;
    reference: string;
    status: OrderDto['status'];
    totalUzs: number;
    currency: string;
    createdAt: Date;
    paidAt: Date | null;
    items: {
      id: string;
      courseId: string;
      courseTitle: string;
      courseSlug: string;
      thumbnailUrl: string | null;
      unitPriceUzs: number;
    }[];
    payments: {
      id: string;
      provider: OrderDto['payment'] extends null ? never : NonNullable<OrderDto['payment']>['provider'];
      status: NonNullable<OrderDto['payment']>['status'];
      checkoutUrl: string | null;
      createdAt: Date;
    }[];
  }): OrderDto {
    const payment = row.payments[0];
    return {
      id: row.id,
      reference: row.reference,
      status: row.status,
      totalUzs: row.totalUzs,
      currency: row.currency,
      createdAt: row.createdAt.toISOString(),
      paidAt: row.paidAt?.toISOString() ?? null,
      items: row.items,
      payment: payment
        ? {
            id: payment.id,
            provider: payment.provider,
            status: payment.status,
            checkoutUrl: payment.checkoutUrl,
            createdAt: payment.createdAt.toISOString(),
          }
        : null,
    };
  }
}

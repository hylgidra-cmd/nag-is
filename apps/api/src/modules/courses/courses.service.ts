import { Injectable } from '@nestjs/common';
import type {
  CourseDetail,
  CourseListItem,
  CourseModuleSummary,
  Paginated,
  ReviewDto,
} from '@nagis/shared-types';
import type { CourseQueryInput } from '@nagis/shared-validation';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError, ErrorCode } from '../../common/errors/app.error';
import { paginate, toSkipTake } from '../../common/utils/pagination';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { instructorSelect, toInstructorSummary } from '../users/user.mapper';
import {
  courseListSelect,
  sumDuration,
  toCourseListItem,
  toRatingAverage,
} from './course.mapper';

/** How many reviews a course detail page carries inline. */
const DETAIL_REVIEW_LIMIT = 10;

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public catalog query: search, category, level, price, sort, pagination.
   *
   * Only PUBLISHED courses are ever returned here. Drafts are reachable only
   * through the admin endpoints, which require a role check.
   */
  async list(query: CourseQueryInput): Promise<Paginated<CourseListItem>> {
    const where: Prisma.CourseWhereInput = {
      status: 'PUBLISHED',
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.level && query.level.length > 0 ? { level: { in: query.level } } : {}),
      ...(query.instructorId ? { instructorId: query.instructorId } : {}),
      ...(query.price === 'free' ? { priceUzs: 0 } : {}),
      ...(query.price === 'paid' ? { priceUzs: { gt: 0 } } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' as const } },
              { summary: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: this.toOrderBy(query.sort),
        ...toSkipTake(query),
        select: courseListSelect,
      }),
      this.prisma.course.count({ where }),
    ]);

    return paginate(rows.map(toCourseListItem), total, query);
  }

  private toOrderBy(sort: CourseQueryInput['sort']): Prisma.CourseOrderByWithRelationInput[] {
    switch (sort) {
      case 'oldest':
        return [{ publishedAt: 'asc' }, { createdAt: 'asc' }];
      case 'price_asc':
        return [{ priceUzs: 'asc' }, { title: 'asc' }];
      case 'price_desc':
        return [{ priceUzs: 'desc' }, { title: 'asc' }];
      case 'rating':
        // Courses with no reviews sort last rather than appearing as 0-star.
        return [{ ratingAverageBp: 'desc' }, { ratingCount: 'desc' }];
      case 'popular':
        return [{ enrollmentCount: 'desc' }, { ratingAverageBp: 'desc' }];
      case 'title':
        return [{ title: 'asc' }];
      case 'newest':
      default:
        return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
    }
  }

  /** Small curated lists used by the landing page. */
  async featured(limit = 6): Promise<CourseListItem[]> {
    const rows = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ enrollmentCount: 'desc' }, { ratingAverageBp: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      select: courseListSelect,
    });
    return rows.map(toCourseListItem);
  }

  async newest(limit = 6): Promise<CourseListItem[]> {
    const rows = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: courseListSelect,
    });
    return rows.map(toCourseListItem);
  }

  async free(limit = 6): Promise<CourseListItem[]> {
    const rows = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED', priceUzs: 0 },
      orderBy: [{ enrollmentCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      select: courseListSelect,
    });
    return rows.map(toCourseListItem);
  }

  /**
   * Course detail page.
   *
   * Visible to anonymous visitors, but what it *contains* depends on the
   * caller: lesson accessibility and enrollment state are resolved
   * server-side. `videoRef` is never part of this payload at all — playback
   * is requested per lesson through the lessons endpoint, which re-checks
   * access.
   */
  async getBySlug(slug: string, viewer?: AuthenticatedUser): Promise<CourseDetail> {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: {
        ...courseListSelect,
        description: true,
        objectives: true,
        prerequisites: true,
        targetAudience: true,
        status: true,
        instructorId: true,
        modules: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            position: true,
            lessons: {
              where: { isPublished: true },
              orderBy: { position: 'asc' },
              select: {
                id: true,
                slug: true,
                title: true,
                type: true,
                durationMinutes: true,
                position: true,
                isPreview: true,
                quiz: { select: { id: true } },
              },
            },
          },
        },
        reviews: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: DETAIL_REVIEW_LIMIT,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!course) throw AppError.notFound(ErrorCode.COURSE_NOT_FOUND, 'Course not found');

    const isStaff = viewer?.role === 'ADMIN' || viewer?.id === course.instructorId;

    // An unpublished course is visible only to staff, and is reported as
    // missing to everyone else so drafts cannot be probed by slug.
    if (course.status !== 'PUBLISHED' && !isStaff) {
      throw AppError.notFound(ErrorCode.COURSE_NOT_FOUND, 'Course not found');
    }

    const enrollment = viewer
      ? await this.prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: viewer.id, courseId: course.id } },
          select: { id: true, status: true, lastLessonId: true },
        })
      : null;

    const hasFullAccess = isStaff || (enrollment !== null && enrollment.status !== 'CANCELLED');

    const totalDuration = sumDuration(course.modules);

    const modules: CourseModuleSummary[] = course.modules.map((courseModule) => {
      const moduleDuration = courseModule.lessons.reduce(
        (sum, lesson) => sum + lesson.durationMinutes,
        0,
      );
      return {
        id: courseModule.id,
        title: courseModule.title,
        description: courseModule.description,
        position: courseModule.position,
        durationMinutes: moduleDuration,
        lessons: courseModule.lessons.map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          type: lesson.type,
          durationMinutes: lesson.durationMinutes,
          position: lesson.position,
          isPreview: lesson.isPreview,
          isAccessible: hasFullAccess || lesson.isPreview,
          hasQuiz: lesson.quiz !== null,
        })),
      };
    });

    const progressPercent = enrollment
      ? await this.computeProgressPercent(viewer!.id, course.id, totalDuration.lessonCount)
      : 0;

    const reviews: ReviewDto[] = course.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      author: {
        id: review.user.id,
        fullName: review.user.fullName,
        avatarUrl: review.user.avatarUrl,
      },
    }));

    const viewerSaved = viewer
      ? (await this.prisma.savedCourse.findUnique({
          where: { userId_courseId: { userId: viewer.id, courseId: course.id } },
          select: { id: true },
        })) !== null
      : false;

    const viewerHasReviewed = viewer
      ? (await this.prisma.review.findUnique({
          where: { userId_courseId: { userId: viewer.id, courseId: course.id } },
          select: { id: true },
        })) !== null
      : false;

    return {
      ...toCourseListItem(course),
      durationMinutes: totalDuration.durationMinutes,
      lessonCount: totalDuration.lessonCount,
      description: course.description,
      objectives: course.objectives,
      prerequisites: course.prerequisites,
      targetAudience: course.targetAudience,
      status: course.status,
      modules,
      reviews,
      viewerEnrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            progressPercent,
            lastLessonId: enrollment.lastLessonId,
          }
        : null,
      viewerHasReviewed,
      viewerSaved,
    };
  }

  /** Share of a course's published lessons the user has completed. */
  async computeProgressPercent(
    userId: string,
    courseId: string,
    totalLessons?: number,
  ): Promise<number> {
    const total =
      totalLessons ??
      (await this.prisma.lesson.count({
        where: { isPublished: true, module: { courseId } },
      }));

    if (total === 0) return 0;

    const completed = await this.prisma.lessonProgress.count({
      where: { userId, courseId, status: 'COMPLETED' },
    });

    return Math.min(100, Math.round((completed / total) * 100));
  }

  /** Resolves a slug to an id, raising a 404 rather than returning null. */
  async requireIdBySlug(slug: string): Promise<string> {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!course) throw AppError.notFound(ErrorCode.COURSE_NOT_FOUND, 'Course not found');
    return course.id;
  }

  /** Courses taught by one instructor, for the public instructor section. */
  async listInstructors(limit = 4) {
    const rows = await this.prisma.user.findMany({
      where: {
        role: { in: ['INSTRUCTOR', 'ADMIN'] },
        isActive: true,
        coursesTaught: { some: { status: 'PUBLISHED' } },
      },
      select: {
        ...instructorSelect,
        _count: { select: { coursesTaught: { where: { status: 'PUBLISHED' } } } },
      },
      take: limit,
    });

    return rows.map((row) => ({
      ...toInstructorSummary(row),
      courseCount: row._count.coursesTaught,
    }));
  }

  /**
   * Recomputes a course's denormalised rating from its real published
   * reviews. Called after any review insert, update or delete.
   */
  async recomputeRating(courseId: string): Promise<void> {
    const aggregate = await this.prisma.review.aggregate({
      where: { courseId, isPublished: true },
      _sum: { rating: true },
      _count: { rating: true },
    });

    const sum = aggregate._sum.rating ?? 0;
    const count = aggregate._count.rating;

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        ratingSum: sum,
        ratingCount: count,
        // Basis points: 4.75 stars -> 475. Integer arithmetic only.
        ratingAverageBp: count > 0 ? Math.round((sum * 100) / count) : 0,
      },
    });
  }

  /** Recomputes the denormalised enrollment counter. */
  async recomputeEnrollmentCount(courseId: string): Promise<void> {
    const count = await this.prisma.enrollment.count({
      where: { courseId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    });
    await this.prisma.course.update({
      where: { id: courseId },
      data: { enrollmentCount: count },
    });
  }

  /** Exposed for tests and for the rating recomputation helper. */
  static ratingToBasisPoints(sum: number, count: number): number {
    return count > 0 ? Math.round((sum * 100) / count) : 0;
  }

  static basisPointsToAverage = toRatingAverage;
}

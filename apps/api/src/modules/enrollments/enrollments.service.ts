import { Injectable } from '@nestjs/common';
import type { CourseListItem, EnrollmentDto, Paginated } from '@nagis/shared-types';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError, ErrorCode } from '../../common/errors/app.error';
import { paginate, toSkipTake } from '../../common/utils/pagination';
import { courseListSelect, toCourseListItem } from '../courses/course.mapper';

/**
 * Enrollment and access authority.
 *
 * `assertLessonAccess` is the single place that decides whether a user may
 * open a lesson. Every route that serves lesson content goes through it, so
 * there is one rule rather than a copy per endpoint.
 */
@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enrolls a user in a course.
   *
   * Free courses enrol immediately. Paid courses require a PAID order
   * containing the course — the price is read from the database and the
   * payment state is checked server-side, so a client cannot enrol itself
   * into paid content by calling this endpoint directly.
   */
  async enroll(userId: string, courseId: string): Promise<EnrollmentDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true, priceUzs: true },
    });

    if (!course) throw AppError.notFound(ErrorCode.COURSE_NOT_FOUND, 'Course not found');

    if (course.status !== 'PUBLISHED') {
      throw AppError.badRequest(
        ErrorCode.COURSE_NOT_PUBLISHED,
        'This course is not published',
      );
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, status: true },
    });

    if (existing && existing.status !== 'CANCELLED') {
      throw AppError.conflict(ErrorCode.ALREADY_ENROLLED, 'Already enrolled in this course');
    }

    if (course.priceUzs > 0) {
      const paid = await this.prisma.orderItem.findFirst({
        where: { courseId, order: { userId, status: 'PAID' } },
        select: { id: true },
      });

      if (!paid) {
        throw AppError.paymentRequired(
          ErrorCode.PAYMENT_REQUIRED,
          'This course must be purchased before enrolling',
        );
      }
    }

    // Re-enrolling after cancelling reuses the row, so history is preserved.
    await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { status: 'ACTIVE', completedAt: null },
      create: { userId, courseId, status: 'ACTIVE' },
    });

    await this.recomputeCourseEnrollmentCount(courseId);

    const dto = await this.findOne(userId, courseId);
    if (!dto) throw AppError.notFound(ErrorCode.NOT_ENROLLED, 'Enrollment not found');
    return dto;
  }

  /**
   * The authoritative lesson access check.
   *
   * Access is granted when the lesson is a preview, when the user has a live
   * enrollment, or when the user is staff for that course. Everything else is
   * refused, and an unpublished lesson is reported as missing.
   */
  async assertLessonAccess(
    lessonId: string,
    user: { id: string; role: string } | undefined,
  ): Promise<{
    lessonId: string;
    courseId: string;
    courseSlug: string;
    coursePriceUzs: number;
    isEnrolled: boolean;
  }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        isPreview: true,
        isPublished: true,
        module: {
          select: {
            course: {
              select: { id: true, slug: true, priceUzs: true, status: true, instructorId: true },
            },
          },
        },
      },
    });

    if (!lesson || !lesson.isPublished) {
      throw AppError.notFound(ErrorCode.LESSON_NOT_FOUND, 'Lesson not found');
    }

    const course = lesson.module.course;

    const isStaff = user?.role === 'ADMIN' || (user !== undefined && user.id === course.instructorId);

    // A draft course's lessons are visible only to staff, and reported as
    // missing to everyone else so drafts cannot be enumerated.
    if (course.status !== 'PUBLISHED' && !isStaff) {
      throw AppError.notFound(ErrorCode.LESSON_NOT_FOUND, 'Lesson not found');
    }

    const enrollment = user
      ? await this.prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
          select: { status: true },
        })
      : null;

    const isEnrolled = enrollment !== null && enrollment.status !== 'CANCELLED';

    if (!lesson.isPreview && !isEnrolled && !isStaff) {
      throw AppError.forbidden(
        ErrorCode.LESSON_LOCKED,
        course.priceUzs > 0
          ? 'This course must be purchased to open this lesson'
          : 'Enrol in this course to open this lesson',
      );
    }

    return {
      lessonId: lesson.id,
      courseId: course.id,
      courseSlug: course.slug,
      coursePriceUzs: course.priceUzs,
      isEnrolled: isEnrolled || isStaff,
    };
  }

  /** One enrollment as a DTO, or null when the user is not enrolled. */
  async findOne(userId: string, courseId: string): Promise<EnrollmentDto | null> {
    const row = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { course: { select: courseListSelect } },
    });

    if (!row) return null;
    return this.toDto(userId, row.course, row);
  }

  /** The signed-in student's enrollments. */
  async listMine(
    userId: string,
    query: { page: number; perPage: number; status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' },
  ): Promise<Paginated<EnrollmentDto>> {
    const where: Prisma.EnrollmentWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : { status: { not: 'CANCELLED' } }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        orderBy: [{ lastAccessedAt: 'desc' }, { enrolledAt: 'desc' }],
        ...toSkipTake(query),
        include: { course: { select: courseListSelect } },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    const items = await Promise.all(
      rows.map((row) => this.toDto(userId, row.course, row)),
    );

    return paginate(items, total, query);
  }

  /** Courses the student bookmarked. */
  async listSaved(userId: string): Promise<CourseListItem[]> {
    const rows = await this.prisma.savedCourse.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { course: { select: courseListSelect } },
    });
    return rows.map((row) => toCourseListItem(row.course));
  }

  async save(userId: string, courseId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) throw AppError.notFound(ErrorCode.COURSE_NOT_FOUND, 'Course not found');

    await this.prisma.savedCourse.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId },
    });
  }

  async unsave(userId: string, courseId: string): Promise<void> {
    await this.prisma.savedCourse.deleteMany({ where: { userId, courseId } });
  }

  /**
   * Builds an EnrollmentDto, including the real completion counts and the
   * lesson the student should resume from.
   */
  private async toDto(
    userId: string,
    course: Parameters<typeof toCourseListItem>[0],
    enrollment: {
      id: string;
      status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
      enrolledAt: Date;
      completedAt: Date | null;
      lastAccessedAt: Date | null;
      lastLessonId: string | null;
      courseId: string;
    },
  ): Promise<EnrollmentDto> {
    const [totalLessons, completedLessons] = await this.prisma.$transaction([
      this.prisma.lesson.count({
        where: { isPublished: true, module: { courseId: enrollment.courseId } },
      }),
      this.prisma.lessonProgress.count({
        where: { userId, courseId: enrollment.courseId, status: 'COMPLETED' },
      }),
    ]);

    const progressPercent =
      totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

    return {
      id: enrollment.id,
      status: enrollment.status,
      progressPercent,
      completedLessons,
      totalLessons,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      completedAt: enrollment.completedAt?.toISOString() ?? null,
      lastAccessedAt: enrollment.lastAccessedAt?.toISOString() ?? null,
      course: toCourseListItem(course),
      nextLesson: await this.findNextLesson(userId, enrollment.courseId, enrollment.lastLessonId),
    };
  }

  /**
   * Where "continue learning" should go: the last opened lesson if it is
   * still incomplete, otherwise the first lesson without completed progress,
   * otherwise null (the course is finished).
   */
  private async findNextLesson(
    userId: string,
    courseId: string,
    lastLessonId: string | null,
  ): Promise<EnrollmentDto['nextLesson']> {
    const lessons = await this.prisma.lesson.findMany({
      where: { isPublished: true, module: { courseId } },
      orderBy: [{ module: { position: 'asc' } }, { position: 'asc' }],
      select: {
        id: true,
        title: true,
        module: { select: { title: true, course: { select: { slug: true } } } },
        progress: { where: { userId }, select: { status: true } },
      },
    });

    if (lessons.length === 0) return null;

    const isDone = (lesson: (typeof lessons)[number]) =>
      lesson.progress[0]?.status === 'COMPLETED';

    const resumeTarget =
      lessons.find((lesson) => lesson.id === lastLessonId && !isDone(lesson)) ??
      lessons.find((lesson) => !isDone(lesson));

    if (!resumeTarget) return null;

    return {
      id: resumeTarget.id,
      title: resumeTarget.title,
      moduleTitle: resumeTarget.module.title,
      courseSlug: resumeTarget.module.course.slug,
    };
  }

  /** Keeps the denormalised counter on Course in step. */
  async recomputeCourseEnrollmentCount(courseId: string): Promise<void> {
    const count = await this.prisma.enrollment.count({
      where: { courseId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    });
    await this.prisma.course.update({
      where: { id: courseId },
      data: { enrollmentCount: count },
    });
  }
}

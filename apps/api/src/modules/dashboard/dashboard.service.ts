import { Injectable } from '@nestjs/common';
import type { ActivityPoint, DashboardSummary } from '@nagis/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError, ErrorCode } from '../../common/errors/app.error';
import { dayKey, daysAgo, lastNDays } from '../../common/utils/duration';
import { toPublicUser } from '../users/user.mapper';
import { EnrollmentsService } from '../enrollments/enrollments.service';

/** How many days the activity chart covers. */
const ACTIVITY_WINDOW_DAYS = 30;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  /**
   * Everything the student dashboard renders.
   *
   * Every number is computed from real rows. The activity series is zero-
   * filled across the window so the chart has a continuous x-axis, but a day
   * with no learning genuinely reads zero — nothing is fabricated to make the
   * chart look busy.
   */
  async getSummary(userId: string): Promise<DashboardSummary> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound(ErrorCode.USER_NOT_FOUND, 'User not found');

    const since = daysAgo(ACTIVITY_WINDOW_DAYS - 1);

    const [
      activeCourses,
      completedCourses,
      completedLessons,
      certificates,
      completions,
      enrolledCourseIds,
    ] = await this.prisma.$transaction([
      this.prisma.enrollment.count({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.enrollment.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.lessonProgress.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.certificate.count({ where: { userId } }),
      // Completions in the window, with the lesson duration and the course's
      // category, which drives both the activity chart and the donut.
      this.prisma.lessonProgress.findMany({
        where: { userId, status: 'COMPLETED', completedAt: { gte: since } },
        select: {
          completedAt: true,
          lesson: { select: { durationMinutes: true } },
          course: {
            select: { category: { select: { name: true, accent: true } } },
          },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { userId, status: { not: 'CANCELLED' } },
        select: { courseId: true },
      }),
    ]);

    const courseIds = enrolledCourseIds.map((row) => row.courseId);

    // Total lessons across enrolled courses, for the "x of y" stat.
    const totalLessons =
      courseIds.length > 0
        ? await this.prisma.lesson.count({
            where: { isPublished: true, module: { courseId: { in: courseIds } } },
          })
        : 0;

    // All-time learned minutes, not just the window.
    const learnedAggregate = await this.prisma.lessonProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { lesson: { select: { durationMinutes: true } } },
    });
    const learnedMinutes = learnedAggregate.reduce(
      (sum, row) => sum + row.lesson.durationMinutes,
      0,
    );

    /* ---- Activity series: zero-filled, real counts ---- */
    const buckets = new Map<string, { completedLessons: number; minutes: number }>();
    for (const day of lastNDays(ACTIVITY_WINDOW_DAYS)) {
      buckets.set(day, { completedLessons: 0, minutes: 0 });
    }

    for (const row of completions) {
      if (!row.completedAt) continue;
      const key = dayKey(row.completedAt);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.completedLessons += 1;
      bucket.minutes += row.lesson.durationMinutes;
    }

    const activity: ActivityPoint[] = [...buckets.entries()].map(([date, value]) => ({
      date,
      completedLessons: value.completedLessons,
      minutes: value.minutes,
    }));

    /* ---- Category breakdown ---- */
    const byCategory = new Map<string, { accent: string | null; lessons: number }>();
    for (const row of completions) {
      const name = row.course.category.name;
      const current = byCategory.get(name);
      if (current) {
        current.lessons += 1;
      } else {
        byCategory.set(name, { accent: row.course.category.accent, lessons: 1 });
      }
    }

    const categoryBreakdown = [...byCategory.entries()]
      .map(([categoryName, value]) => ({
        categoryName,
        accent: value.accent,
        lessons: value.lessons,
      }))
      .sort((a, b) => b.lessons - a.lessons);

    /* ---- Continue learning: the three most recently touched courses ---- */
    const continueLearning = await this.enrollments.listMine(userId, {
      page: 1,
      perPage: 3,
      status: 'ACTIVE',
    });

    return {
      user: toPublicUser(user),
      stats: {
        activeCourses,
        completedCourses,
        completedLessons,
        totalLessons,
        certificates,
        learnedMinutes,
        streakDays: this.computeStreak(activity),
      },
      activity,
      categoryBreakdown,
      continueLearning: continueLearning.items,
      recentActivity: await this.recentActivity(userId),
    };
  }

  /**
   * Consecutive days ending today (or yesterday) with at least one completed
   * lesson.
   *
   * Counting back from yesterday when today is empty is deliberate: a streak
   * should not appear broken first thing in the morning before any study.
   */
  private computeStreak(activity: ActivityPoint[]): number {
    const reversed = [...activity].reverse();
    let streak = 0;

    for (const [index, point] of reversed.entries()) {
      if (point.completedLessons > 0) {
        streak += 1;
      } else if (index === 0) {
        // Today is empty: keep looking at yesterday.
        continue;
      } else {
        break;
      }
    }

    return streak;
  }

  /** The student's last few meaningful events, newest first. */
  private async recentActivity(userId: string): Promise<DashboardSummary['recentActivity']> {
    const [lessons, enrolments, certs, quizzes] = await this.prisma.$transaction([
      this.prisma.lessonProgress.findMany({
        where: { userId, status: 'COMPLETED', completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          completedAt: true,
          lesson: { select: { title: true } },
          course: { select: { title: true, slug: true } },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { userId, status: { not: 'CANCELLED' } },
        orderBy: { enrolledAt: 'desc' },
        take: 4,
        select: {
          id: true,
          enrolledAt: true,
          course: { select: { title: true, slug: true } },
        },
      }),
      this.prisma.certificate.findMany({
        where: { userId },
        orderBy: { issuedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          issuedAt: true,
          courseTitle: true,
          course: { select: { slug: true } },
        },
      }),
      this.prisma.quizAttempt.findMany({
        where: { userId, passed: true },
        orderBy: { submittedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          submittedAt: true,
          quiz: {
            select: {
              title: true,
              lesson: {
                select: { module: { select: { course: { select: { title: true, slug: true } } } } },
              },
            },
          },
        },
      }),
    ]);

    const events: DashboardSummary['recentActivity'] = [
      ...lessons.map((row) => ({
        id: `lesson-${row.id}`,
        type: 'LESSON_COMPLETED' as const,
        title: row.lesson.title,
        courseTitle: row.course.title,
        courseSlug: row.course.slug,
        at: (row.completedAt ?? new Date()).toISOString(),
      })),
      ...enrolments.map((row) => ({
        id: `enrol-${row.id}`,
        type: 'COURSE_ENROLLED' as const,
        title: row.course.title,
        courseTitle: row.course.title,
        courseSlug: row.course.slug,
        at: row.enrolledAt.toISOString(),
      })),
      ...certs.map((row) => ({
        id: `cert-${row.id}`,
        type: 'CERTIFICATE_ISSUED' as const,
        title: row.courseTitle,
        courseTitle: row.courseTitle,
        courseSlug: row.course.slug,
        at: row.issuedAt.toISOString(),
      })),
      ...quizzes.map((row) => ({
        id: `quiz-${row.id}`,
        type: 'QUIZ_PASSED' as const,
        title: row.quiz.title,
        courseTitle: row.quiz.lesson.module.course.title,
        courseSlug: row.quiz.lesson.module.course.slug,
        at: row.submittedAt.toISOString(),
      })),
    ];

    return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
  }
}

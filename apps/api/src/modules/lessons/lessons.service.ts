import { Injectable } from '@nestjs/common';
import type { LessonDetail, QuizDto } from '@nagis/shared-types';
import type { LessonProgressInput } from '@nagis/shared-validation';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError, ErrorCode } from '../../common/errors/app.error';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { VideoService } from '../video/video.service';
import { CertificatesService } from '../certificates/certificates.service';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollments: EnrollmentsService,
    private readonly video: VideoService,
    private readonly certificates: CertificatesService,
  ) {}

  /**
   * Full lesson payload for the learning view.
   *
   * Access is checked first via EnrollmentsService; only then is the stored
   * `videoRef` resolved into a playback descriptor. The raw reference never
   * appears in the response, so a locked lesson leaks nothing even if a
   * client calls this endpoint directly.
   */
  async getDetail(lessonId: string, user: AuthenticatedUser | undefined): Promise<LessonDetail> {
    // Throws 403/404 when the caller may not open this lesson.
    const access = await this.enrollments.assertLessonAccess(lessonId, user);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        description: true,
        content: true,
        videoRef: true,
        durationMinutes: true,
        position: true,
        isPreview: true,
        moduleId: true,
        module: {
          select: {
            title: true,
            position: true,
            course: { select: { id: true, slug: true, title: true } },
          },
        },
        resources: {
          orderBy: { position: 'asc' },
          select: { id: true, title: true, url: true, sizeBytes: true, mimeType: true },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            passingScore: true,
            questions: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                prompt: true,
                explanation: true,
                position: true,
                points: true,
                options: {
                  orderBy: { position: 'asc' },
                  // `isCorrect` is deliberately NOT selected: sending it would
                  // hand the student the answer key.
                  select: { id: true, text: true },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) throw AppError.notFound(ErrorCode.LESSON_NOT_FOUND, 'Lesson not found');

    const progress = user
      ? await this.prisma.lessonProgress.findUnique({
          where: { userId_lessonId: { userId: user.id, lessonId } },
          select: {
            status: true,
            completedAt: true,
            lastPositionSeconds: true,
            notes: true,
          },
        })
      : null;

    // Record that the student opened this lesson, so "continue learning"
    // resumes here next time.
    if (user && access.isEnrolled) {
      await this.prisma.enrollment.updateMany({
        where: { userId: user.id, courseId: access.courseId },
        data: { lastLessonId: lessonId, lastAccessedAt: new Date() },
      });
    }

    const siblings = await this.orderedLessonIds(access.courseId);
    const index = siblings.indexOf(lessonId);

    const quiz = lesson.quiz
      ? await this.buildQuizDto(lesson.quiz, user)
      : null;

    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      type: lesson.type,
      description: lesson.description,
      content: lesson.content,
      durationMinutes: lesson.durationMinutes,
      position: lesson.position,
      isPreview: lesson.isPreview,
      // Null when no provider is configured — the UI says so rather than
      // showing a broken player.
      video: await this.video.resolve(lesson.videoRef),
      resources: lesson.resources,
      moduleId: lesson.moduleId,
      moduleTitle: lesson.module.title,
      courseId: lesson.module.course.id,
      courseSlug: lesson.module.course.slug,
      courseTitle: lesson.module.course.title,
      progress: progress
        ? {
            status: progress.status,
            completedAt: progress.completedAt?.toISOString() ?? null,
            lastPositionSeconds: progress.lastPositionSeconds,
            notes: progress.notes,
          }
        : null,
      quiz,
      prevLessonId: index > 0 ? (siblings[index - 1] ?? null) : null,
      nextLessonId: index >= 0 && index < siblings.length - 1 ? (siblings[index + 1] ?? null) : null,
    };
  }

  /**
   * Marks a lesson complete.
   *
   * When this completes the final lesson, the enrollment is closed and a
   * certificate is issued — both inside the same call so the two can never
   * disagree.
   */
  async complete(
    lessonId: string,
    user: AuthenticatedUser,
  ): Promise<{
    progressPercent: number;
    completedLessons: number;
    totalLessons: number;
    courseCompleted: boolean;
    certificateCode: string | null;
  }> {
    const access = await this.enrollments.assertLessonAccess(lessonId, user);

    // A preview lesson can be watched without enrolling, but progress only
    // means something for an enrolled student.
    if (!access.isEnrolled) {
      throw AppError.forbidden(ErrorCode.NOT_ENROLLED, 'Enrol in this course to track progress');
    }

    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { status: 'COMPLETED', completedAt: new Date() },
      create: {
        userId: user.id,
        lessonId,
        courseId: access.courseId,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return this.finaliseCourseProgress(user, access.courseId);
  }

  /** Clears a completion, for a student who wants to revisit a lesson. */
  async uncomplete(
    lessonId: string,
    user: AuthenticatedUser,
  ): Promise<{ progressPercent: number; completedLessons: number; totalLessons: number }> {
    const access = await this.enrollments.assertLessonAccess(lessonId, user);
    if (!access.isEnrolled) {
      throw AppError.forbidden(ErrorCode.NOT_ENROLLED, 'Enrol in this course to track progress');
    }

    await this.prisma.lessonProgress.updateMany({
      where: { userId: user.id, lessonId },
      data: { status: 'IN_PROGRESS', completedAt: null },
    });

    const counts = await this.countProgress(user.id, access.courseId);

    // The course is no longer finished, so reopen the enrollment. The
    // certificate is deliberately NOT revoked: it was genuinely earned.
    if (counts.completedLessons < counts.totalLessons) {
      await this.prisma.enrollment.updateMany({
        where: { userId: user.id, courseId: access.courseId, status: 'COMPLETED' },
        data: { status: 'ACTIVE', completedAt: null },
      });
    }

    return counts;
  }

  /** Saves video position and private notes. */
  async saveProgress(
    lessonId: string,
    user: AuthenticatedUser,
    input: LessonProgressInput,
  ): Promise<void> {
    const access = await this.enrollments.assertLessonAccess(lessonId, user);
    if (!access.isEnrolled) {
      throw AppError.forbidden(ErrorCode.NOT_ENROLLED, 'Enrol in this course to save progress');
    }

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      select: { status: true },
    });

    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: {
        ...(input.lastPositionSeconds !== undefined
          ? { lastPositionSeconds: input.lastPositionSeconds }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
        // Opening a lesson moves it out of NOT_STARTED, but never undoes a
        // completion.
        ...(existing?.status === 'COMPLETED' ? {} : { status: 'IN_PROGRESS' }),
      },
      create: {
        userId: user.id,
        lessonId,
        courseId: access.courseId,
        status: 'IN_PROGRESS',
        lastPositionSeconds: input.lastPositionSeconds ?? 0,
        notes: input.notes ?? null,
      },
    });
  }

  /* --------------------------------------------------------------------
   * Internals
   * ----------------------------------------------------------------- */

  private async countProgress(userId: string, courseId: string) {
    const [totalLessons, completedLessons] = await this.prisma.$transaction([
      this.prisma.lesson.count({ where: { isPublished: true, module: { courseId } } }),
      this.prisma.lessonProgress.count({
        where: { userId, courseId, status: 'COMPLETED' },
      }),
    ]);

    return {
      totalLessons,
      completedLessons,
      progressPercent:
        totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0,
    };
  }

  /** Closes the enrollment and issues a certificate once every lesson is done. */
  private async finaliseCourseProgress(user: AuthenticatedUser, courseId: string) {
    const counts = await this.countProgress(user.id, courseId);
    const courseCompleted = counts.totalLessons > 0 && counts.completedLessons >= counts.totalLessons;

    let certificateCode: string | null = null;

    if (courseCompleted) {
      await this.prisma.enrollment.updateMany({
        where: { userId: user.id, courseId, status: { not: 'COMPLETED' } },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      const certificate = await this.certificates.issueIfEarned(user.id, courseId);
      certificateCode = certificate?.verificationCode ?? null;
    }

    return { ...counts, courseCompleted, certificateCode };
  }

  /** Lesson ids in curriculum order, for previous/next navigation. */
  private async orderedLessonIds(courseId: string): Promise<string[]> {
    const lessons = await this.prisma.lesson.findMany({
      where: { isPublished: true, module: { courseId } },
      orderBy: [{ module: { position: 'asc' } }, { position: 'asc' }],
      select: { id: true },
    });
    return lessons.map((lesson) => lesson.id);
  }

  /**
   * Builds the quiz payload.
   *
   * Option correctness is never included. The student's best previous attempt
   * is summarised so the UI can show it without replaying the answer sheet.
   */
  private async buildQuizDto(
    quiz: {
      id: string;
      title: string;
      description: string | null;
      passingScore: number;
      questions: {
        id: string;
        prompt: string;
        explanation: string | null;
        position: number;
        points: number;
        options: { id: string; text: string }[];
      }[];
    },
    user: AuthenticatedUser | undefined,
  ): Promise<QuizDto> {
    const bestAttempt = user
      ? await this.prisma.quizAttempt.findFirst({
          where: { quizId: quiz.id, userId: user.id },
          orderBy: [{ score: 'desc' }, { submittedAt: 'desc' }],
          select: { id: true, score: true, maxScore: true, passed: true, submittedAt: true },
        })
      : null;

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        // The explanation is only useful after grading, and revealing it up
        // front would hint at the answer.
        explanation: null,
        position: question.position,
        points: question.points,
        options: question.options,
      })),
      bestAttempt: bestAttempt
        ? {
            id: bestAttempt.id,
            score: bestAttempt.score,
            passed: bestAttempt.passed,
            submittedAt: bestAttempt.submittedAt.toISOString(),
          }
        : null,
    };
  }
}

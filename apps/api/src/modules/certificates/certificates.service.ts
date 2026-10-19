import { Injectable, Logger } from '@nestjs/common';
import type { CertificateDto, CertificateVerification } from '@nagis/shared-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppError, ErrorCode } from '../../common/errors/app.error';
import { generateCertificateCode } from '../../common/utils/tokens';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Issues a certificate if, and only if, every published lesson in the
   * course is completed.
   *
   * The completion check is re-run here rather than trusted from the caller,
   * so a certificate can never be minted by hitting an endpoint out of order.
   * Returns the existing certificate when one was already issued, which makes
   * this safe to call repeatedly.
   */
  async issueIfEarned(userId: string, courseId: string): Promise<CertificateDto | null> {
    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return this.toDto(existing);

    const [totalLessons, completedLessons] = await this.prisma.$transaction([
      this.prisma.lesson.count({ where: { isPublished: true, module: { courseId } } }),
      this.prisma.lessonProgress.count({
        where: { userId, courseId, status: 'COMPLETED' },
      }),
    ]);

    // A course with no lessons cannot be "completed".
    if (totalLessons === 0 || completedLessons < totalLessons) return null;

    const [user, course] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } }),
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: {
          title: true,
          instructor: { select: { fullName: true } },
          modules: { select: { lessons: { select: { durationMinutes: true } } } },
        },
      }),
    ]);

    if (!user || !course) return null;

    const durationMinutes = course.modules.reduce(
      (sum, item) => sum + item.lessons.reduce((inner, lesson) => inner + lesson.durationMinutes, 0),
      0,
    );

    // The verification code is random, so a collision is possible in
    // principle. The unique index is the authority; retry a few times rather
    // than failing the student's course completion.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await this.prisma.certificate.create({
          data: {
            userId,
            courseId,
            verificationCode: generateCertificateCode(),
            recipientName: user.fullName,
            courseTitle: course.title,
            instructorName: course.instructor.fullName,
            durationMinutes,
          },
        });
        return this.toDto(created);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          // Prisma types `meta` loosely; target is usually string[] but can
          // be a string or absent, so it is normalised rather than stringified
          // (which would yield "[object Object]").
          const rawTarget: unknown = error.meta?.['target'];
          const target = Array.isArray(rawTarget)
            ? rawTarget.map((part) => String(part)).join(',')
            : typeof rawTarget === 'string'
              ? rawTarget
              : '';

          // Another request issued the certificate first: return theirs.
          if (target.includes('userId') || target.includes('courseId')) {
            const concurrent = await this.prisma.certificate.findUnique({
              where: { userId_courseId: { userId, courseId } },
            });
            if (concurrent) return this.toDto(concurrent);
          }

          // Code collision: generate a new one and try again.
          this.logger.warn(`Certificate code collision, retrying (attempt ${attempt + 1})`);
          continue;
        }
        throw error;
      }
    }

    throw AppError.conflict(
      'CERTIFICATE_CODE_EXHAUSTED',
      'Could not allocate a unique certificate code',
    );
  }

  /** Certificates belonging to the signed-in student. */
  async listMine(userId: string): Promise<CertificateDto[]> {
    const rows = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: { course: { select: { slug: true } } },
    });
    return rows.map((row) => this.toDto(row, row.course.slug));
  }

  async getMine(userId: string, code: string): Promise<CertificateDto> {
    const row = await this.prisma.certificate.findFirst({
      where: { userId, verificationCode: code },
      include: { course: { select: { slug: true } } },
    });
    if (!row) throw AppError.notFound(ErrorCode.CERTIFICATE_NOT_FOUND, 'Certificate not found');
    return this.toDto(row, row.course.slug);
  }

  /**
   * Public verification.
   *
   * Returns `{ valid: false, certificate: null }` for an unknown code rather
   * than a 404, so the verification page can show a clear answer either way.
   * Only the printed fields are exposed — never the holder's email or id.
   */
  async verify(code: string): Promise<CertificateVerification> {
    const row = await this.prisma.certificate.findUnique({
      where: { verificationCode: code },
      include: { course: { select: { slug: true } } },
    });

    if (!row) return { valid: false, certificate: null };
    return { valid: true, certificate: this.toDto(row, row.course.slug) };
  }

  private toDto(
    row: {
      id: string;
      verificationCode: string;
      issuedAt: Date;
      courseTitle: string;
      recipientName: string;
      instructorName: string;
      durationMinutes: number;
    },
    courseSlug = '',
  ): CertificateDto {
    return {
      id: row.id,
      verificationCode: row.verificationCode,
      issuedAt: row.issuedAt.toISOString(),
      courseTitle: row.courseTitle,
      courseSlug,
      recipientName: row.recipientName,
      instructorName: row.instructorName,
      durationMinutes: row.durationMinutes,
    };
  }
}

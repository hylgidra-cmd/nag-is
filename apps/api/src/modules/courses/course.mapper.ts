import type { CourseListItem } from '@nagis/shared-types';
import type { Prisma } from '@prisma/client';
import { instructorSelect, toInstructorSummary } from '../users/user.mapper';

/**
 * The exact shape every course list endpoint selects.
 *
 * Declared once as a `const` so the Prisma payload type below stays in step
 * with it; adding a field here is enough to make the mapper typecheck against
 * the new shape.
 */
export const courseListSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  thumbnailUrl: true,
  level: true,
  priceUzs: true,
  comparePriceUzs: true,
  language: true,
  ratingAverageBp: true,
  ratingCount: true,
  enrollmentCount: true,
  publishedAt: true,
  createdAt: true,
  category: { select: { id: true, slug: true, name: true, accent: true, icon: true } },
  instructor: { select: instructorSelect },
  modules: {
    select: {
      lessons: {
        where: { isPublished: true },
        select: { durationMinutes: true },
      },
    },
  },
} satisfies Prisma.CourseSelect;

export type CourseListRow = Prisma.CourseGetPayload<{ select: typeof courseListSelect }>;

/**
 * Converts stored basis points back into a 0..5 average.
 *
 * Returns null when there are no reviews, so the UI can show "no rating yet"
 * instead of a misleading 0.0.
 */
export function toRatingAverage(ratingAverageBp: number, ratingCount: number): number | null {
  if (ratingCount <= 0) return null;
  return Math.round(ratingAverageBp) / 100;
}

/** Sums the duration of a course's published lessons. */
export function sumDuration(modules: { lessons: { durationMinutes: number }[] }[]): {
  durationMinutes: number;
  lessonCount: number;
} {
  let durationMinutes = 0;
  let lessonCount = 0;
  for (const courseModule of modules) {
    for (const lesson of courseModule.lessons) {
      durationMinutes += lesson.durationMinutes;
      lessonCount += 1;
    }
  }
  return { durationMinutes, lessonCount };
}

export function toCourseListItem(row: CourseListRow): CourseListItem {
  const { durationMinutes, lessonCount } = sumDuration(row.modules);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    thumbnailUrl: row.thumbnailUrl,
    level: row.level,
    durationMinutes,
    lessonCount,
    priceUzs: row.priceUzs,
    // A compare price only means something when it is actually higher.
    comparePriceUzs:
      row.comparePriceUzs !== null && row.comparePriceUzs > row.priceUzs
        ? row.comparePriceUzs
        : null,
    isFree: row.priceUzs === 0,
    language: row.language,
    ratingAverage: toRatingAverage(row.ratingAverageBp, row.ratingCount),
    ratingCount: row.ratingCount,
    enrollmentCount: row.enrollmentCount,
    category: {
      id: row.category.id,
      slug: row.category.slug,
      name: row.category.name,
      accent: row.category.accent,
      icon: row.category.icon,
    },
    instructor: toInstructorSummary(row.instructor),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

import type { Metadata } from 'next';
import { t } from '@/i18n';
import {
  getCategories,
  getFeaturedCourses,
  getFreeCourses,
  getInstructors,
  getNewestCourses,
} from '@/lib/api/server';
import { safely } from '@/lib/api/safe';
import { Hero } from '@/components/hero/Hero';
import { CategoryGrid } from '@/components/landing/CategoryGrid';
import { CourseRow } from '@/components/landing/CourseRow';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Benefits } from '@/components/landing/Benefits';
import { Instructors } from '@/components/landing/Instructors';
import { Faq } from '@/components/landing/Faq';
import { CtaBanner } from '@/components/landing/CtaBanner';

export const metadata: Metadata = {
  title: t.meta.homeTitle,
  description: t.meta.homeDescription,
};

/**
 * Landing page.
 *
 * Every content section is backed by the API. The five reads run in parallel
 * and each is individually tolerant: if one endpoint fails the rest of the
 * page still renders, and sections with no data remove themselves instead of
 * showing an empty heading.
 *
 * The hero statistics are derived from the real category and course payloads,
 * never invented. If the catalog reads failed, `stats` is null and the hero
 * renders without numbers rather than with zeroes.
 */
export default async function LandingPage() {
  const [categories, featured, newest, free, instructors] = await Promise.all([
    safely(getCategories, [], 'categories'),
    safely(getFeaturedCourses, [], 'featured courses'),
    safely(getNewestCourses, [], 'newest courses'),
    safely(getFreeCourses, [], 'free courses'),
    safely(getInstructors, [], 'instructors'),
  ]);

  const stats = buildStats(categories, featured, newest, free);

  return (
    <>
      <Hero stats={stats} />

      <CategoryGrid categories={categories} />

      <CourseRow
        eyebrow={t.sections.featured.title}
        title={t.sections.featured.title}
        description={t.sections.featured.subtitle}
        courses={featured}
        viewAllHref="/courses?sort=popular"
        muted
        priority
      />

      <HowItWorks />

      <CourseRow
        eyebrow={t.sections.newest.title}
        title={t.sections.newest.title}
        description={t.sections.newest.subtitle}
        courses={newest}
        viewAllHref="/courses?sort=newest"
      />

      <Benefits />

      <CourseRow
        eyebrow={t.sections.free.title}
        title={t.sections.free.title}
        description={t.sections.free.subtitle}
        courses={free}
        viewAllHref="/courses?price=free"
        muted
      />

      <Instructors instructors={instructors} />

      <Faq />

      <CtaBanner />
    </>
  );
}

/**
 * Derives the hero counters from data actually returned by the API.
 *
 * The course endpoints return curated slices rather than the whole catalog,
 * so courses are de-duplicated by id and the counts describe exactly what is
 * on the page. Returns null when there is nothing real to show.
 */
function buildStats(
  categories: { courseCount: number }[],
  ...courseLists: { id: string; lessonCount: number; durationMinutes: number }[][]
): { courses: number; categories: number; lessons: number; hours: number } | null {
  const unique = new Map<string, { lessonCount: number; durationMinutes: number }>();
  for (const list of courseLists) {
    for (const course of list) unique.set(course.id, course);
  }

  // The catalog total is authoritative for the course count: the curated
  // endpoints overlap and would undercount.
  const totalCourses = categories.reduce((sum, category) => sum + category.courseCount, 0);

  if (totalCourses === 0 && unique.size === 0) return null;

  let lessons = 0;
  let minutes = 0;
  for (const course of unique.values()) {
    lessons += course.lessonCount;
    minutes += course.durationMinutes;
  }

  return {
    courses: totalCourses || unique.size,
    categories: categories.length,
    lessons,
    hours: Math.round(minutes / 60),
  };
}

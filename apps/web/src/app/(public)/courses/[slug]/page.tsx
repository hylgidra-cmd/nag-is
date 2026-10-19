import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, ChevronRight, CircleAlert, Clock, PlayCircle, Users } from 'lucide-react';
import { getCourse } from '@/lib/api/server';
import { isApiError } from '@/lib/api/errors';
import { formatDate, formatDuration, t } from '@/i18n';
import { Badge, Card, SectionHeading, Stars } from '@/components/ui/primitives';
import { CategoryIcon } from '@/components/courses/CategoryIcon';
import { Curriculum } from '@/components/courses/Curriculum';
import { EnrollPanel } from '@/components/courses/EnrollPanel';
import { Reveal } from '@/components/motion/Reveal';

export const dynamic = 'force-dynamic';

/**
 * Loads the course for both `generateMetadata` and the page body.
 *
 * Two details matter here:
 *
 *  * `cache()` dedupes the call within a single request, so rendering the page
 *    hits the API once rather than twice.
 *
 *  * `notFound()` is raised *inside* the loader, which means
 *    `generateMetadata` throws it too. That is what makes the response an
 *    actual HTTP 404. If metadata resolves successfully, Next flushes the
 *    response headers with 200 before the page body runs, and a later
 *    `notFound()` can only swap the markup — the status stays 200.
 */
const loadCourse = cache(async (slug: string) => {
  try {
    return await getCourse(slug);
  } catch (error) {
    // A missing course, or a draft this viewer may not see, is a 404.
    if (isApiError(error) && (error.isNotFound || error.isForbidden)) notFound();
    throw error;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await loadCourse(slug);

  return {
    title: course.title,
    description: course.summary,
    openGraph: {
      title: course.title,
      description: course.summary,
      type: 'article',
      ...(course.thumbnailUrl ? { images: [{ url: course.thumbnailUrl }] } : {}),
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await loadCourse(slug);

  return (
    <article>
      {/* ================= Hero ================= */}
      <header className="border-b border-hairline bg-surface-muted/40">
        <div className="container-page py-8 sm:py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-accent-600">
                  {t.nav.home}
                </Link>
              </li>
              <ChevronRight aria-hidden="true" className="h-3 w-3 text-faint" />
              <li>
                <Link href="/courses" className="transition-colors hover:text-accent-600">
                  {t.nav.courses}
                </Link>
              </li>
              <ChevronRight aria-hidden="true" className="h-3 w-3 text-faint" />
              <li>
                <Link
                  href={`/courses?category=${encodeURIComponent(course.category.slug)}`}
                  className="transition-colors hover:text-accent-600"
                >
                  {course.category.name}
                </Link>
              </li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-surface px-2.5 py-1">
                  <CategoryIcon
                    name={course.category.icon}
                    accent={course.category.accent}
                    className="h-5 w-5"
                  />
                  <span className="text-xs font-medium text-body">{course.category.name}</span>
                </span>
                <Badge tone="outline">{t.course.level[course.level]}</Badge>
                {course.isFree && <Badge tone="success">{t.course.free}</Badge>}
                {course.status !== 'PUBLISHED' && (
                  <Badge tone="warning">{t.course.status[course.status]}</Badge>
                )}
              </div>

              <h1 className="text-display-md sm:text-display-lg">{course.title}</h1>

              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
                {course.summary}
              </p>

              {/* Meta strip — only real values */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-muted">
                {course.ratingAverage !== null ? (
                  <Stars
                    value={course.ratingAverage}
                    count={course.ratingCount}
                    size="md"
                    emptyLabel={t.course.noRating}
                  />
                ) : (
                  <span className="text-sm text-faint">{t.course.noRating}</span>
                )}

                <span className="inline-flex items-center gap-1.5">
                  <PlayCircle aria-hidden="true" className="h-4 w-4 text-faint" />
                  {t.course.lessons(course.lessonCount)}
                </span>

                {course.durationMinutes > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock aria-hidden="true" className="h-4 w-4 text-faint" />
                    {formatDuration(course.durationMinutes)}
                  </span>
                )}

                {course.enrollmentCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users aria-hidden="true" className="h-4 w-4 text-faint" />
                    {t.course.students(course.enrollmentCount)}
                  </span>
                )}
              </div>

              <p className="mt-5 text-sm text-muted">
                {t.course.instructor}:{' '}
                <span className="font-semibold text-heading">
                  {course.instructor.fullName}
                </span>
                {course.instructor.headline && (
                  <span className="text-faint"> · {course.instructor.headline}</span>
                )}
              </p>

              {course.publishedAt && (
                <p className="mt-1 text-xs text-faint">
                  {t.course.publishedAt}: {formatDate(course.publishedAt)}
                </p>
              )}
            </div>

            {/* Enrol panel — sticky on desktop */}
            <div className="lg:row-span-2">
              <div className="lg:sticky lg:top-24">
                <EnrollPanel course={course} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= Body ================= */}
      <div className="container-page py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-12">
          <div className="min-w-0 space-y-12">
            {/* ---- Objectives ---- */}
            {course.objectives.length > 0 && (
              <Reveal as="section">
                <h2 className="text-display-sm">{t.course.objectivesTitle}</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {course.objectives.map((objective) => (
                    <li key={objective} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-[var(--color-success-soft)] text-[var(--color-success)]"
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-sm leading-relaxed text-body">{objective}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {/* ---- Description ---- */}
            <Reveal as="section">
              <h2 className="text-display-sm">{t.course.aboutTitle}</h2>
              <div className="mt-5 space-y-4">
                {course.description.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-[0.9375rem] leading-relaxed text-body">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Reveal>

            {/* ---- Curriculum ---- */}
            <Reveal as="section">
              <SectionHeading
                title={t.course.curriculumTitle}
                description={t.course.curriculumSummary(
                  course.modules.length,
                  course.lessonCount,
                  course.durationMinutes,
                )}
              />
              <div className="mt-6">
                <Curriculum modules={course.modules} courseSlug={course.slug} />
              </div>
            </Reveal>

            {/* ---- Prerequisites ---- */}
            <Reveal as="section">
              <h2 className="text-display-sm">{t.course.prerequisitesTitle}</h2>
              {course.prerequisites.length > 0 ? (
                <ul className="mt-5 space-y-2.5">
                  {course.prerequisites.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CircleAlert
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-faint"
                      />
                      <span className="text-sm leading-relaxed text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">{t.course.prerequisitesNone}</p>
              )}
            </Reveal>

            {/* ---- Audience ---- */}
            {course.targetAudience.length > 0 && (
              <Reveal as="section">
                <h2 className="text-display-sm">{t.course.audienceTitle}</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {course.targetAudience.map((item) => (
                    <li
                      key={item}
                      className="rounded-card border border-hairline bg-surface px-4 py-3 text-sm text-body"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {/* ---- Instructor ---- */}
            <Reveal as="section">
              <h2 className="text-display-sm">{t.course.instructorTitle}</h2>
              <Card className="mt-5 p-6" elevation="none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <Monogram name={course.instructor.fullName} />
                  <div className="min-w-0">
                    <p className="text-base font-bold text-heading">
                      {course.instructor.fullName}
                    </p>
                    {course.instructor.headline && (
                      <p className="mt-0.5 text-sm font-medium text-accent-600 dark:text-accent-300">
                        {course.instructor.headline}
                      </p>
                    )}
                    {course.instructor.bio && (
                      <p className="mt-3 text-sm leading-relaxed text-muted">
                        {course.instructor.bio}
                      </p>
                    )}
                    <Link
                      href={`/courses?instructorId=${course.instructor.id}`}
                      className="mt-4 inline-block text-sm font-medium text-accent-600 underline-offset-4 hover:underline"
                    >
                      {t.common.viewAll} →
                    </Link>
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* ---- Reviews: only real ones ---- */}
            <Reveal as="section">
              <h2 className="text-display-sm">{t.course.reviewsTitle}</h2>
              {course.reviews.length === 0 ? (
                <div className="mt-5 rounded-card border border-dashed border-hairline bg-surface-muted/50 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-heading">{t.course.reviewsEmpty}</p>
                  <p className="mt-1.5 text-sm text-muted">{t.course.reviewsEmptyHint}</p>
                </div>
              ) : (
                <ul className="mt-5 space-y-4">
                  {course.reviews.map((review) => (
                    <li key={review.id}>
                      <Card className="p-5" elevation="none">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Monogram name={review.author.fullName} small />
                            <div>
                              <p className="text-sm font-semibold text-heading">
                                {review.author.fullName}
                              </p>
                              <p className="text-xs text-faint">
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Stars value={review.rating} />
                        </div>
                        {review.comment && (
                          <p className="mt-3.5 text-sm leading-relaxed text-body">
                            {review.comment}
                          </p>
                        )}
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </article>
  );
}

function Monogram({ name, small = false }: { name: string; small?: boolean }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      aria-hidden="true"
      className={
        small
          ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-gradient-to-br from-accent-500 to-violet-accent text-xs font-bold text-white'
          : 'flex h-16 w-16 shrink-0 items-center justify-center rounded-pill bg-gradient-to-br from-accent-500 to-violet-accent text-xl font-extrabold text-white'
      }
    >
      {initials || '?'}
    </span>
  );
}

import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { getCourse, getCurrentUser, getLesson } from '@/lib/api/server';
import { isApiError } from '@/lib/api/errors';
import { t } from '@/i18n';
import { Progress, StateBlock } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Curriculum } from '@/components/courses/Curriculum';
import { LessonPlayer } from '@/components/learning/LessonPlayer';

export const dynamic = 'force-dynamic';

/**
 * Loads the lesson, deduped between metadata and the page body.
 *
 * `notFound()` is raised inside the loader so `generateMetadata` throws it
 * too and the response is a real 404 — see the note in
 * `(public)/courses/[slug]/page.tsx` for why that ordering matters.
 *
 * A 403 is NOT a 404: the lesson exists but is locked, so the page renders a
 * locked state with a route back to the course instead of pretending the
 * lesson is missing.
 */
const loadLesson = cache(async (lessonId: string) => {
  try {
    return { ok: true as const, lesson: await getLesson(lessonId) };
  } catch (error) {
    if (isApiError(error)) {
      if (error.isNotFound) notFound();
      if (error.isForbidden) return { ok: false as const, reason: 'locked' as const };
      if (error.isUnauthorized) return { ok: false as const, reason: 'auth' as const };
    }
    throw error;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const result = await loadLesson(lessonId);

  if (!result.ok) return { title: t.learn.locked.title };

  return {
    title: `${result.lesson.title} · ${result.lesson.courseTitle}`,
    robots: { index: false, follow: false },
  };
}

export default async function LearnLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const result = await loadLesson(lessonId);

  if (!result.ok) {
    /*
     * The API refused the content. How that is presented depends on who is
     * asking:
     *
     *  - anonymous -> send them to sign in and return here, because signing
     *    in may well be all that is needed (they could already own it);
     *  - signed in but not entitled -> explain that enrolment or purchase is
     *    required.
     *
     * Note the API answers 403 (not 401) for an anonymous caller on a locked
     * lesson, because the route is @OptionalAuth and preview lessons are
     * public — so the session has to be checked here rather than inferred
     * from the status code.
     */
    const viewer = await getCurrentUser().catch(() => null);

    if (viewer === null) {
      redirect(`/login?next=${encodeURIComponent(`/learn/${slug}/${lessonId}`)}`);
    }

    const course = await getCourse(slug).catch(() => null);
    const isPaid = (course?.priceUzs ?? 0) > 0;

    return (
      <div className="container-page py-20">
        <StateBlock
          icon={<Lock className="h-5 w-5" />}
          title={t.learn.locked.title}
          description={isPaid ? t.learn.locked.descriptionPaid : t.learn.locked.description}
          action={
            <Button href={`/courses/${slug}`} variant="primary">
              {t.learn.locked.action}
            </Button>
          }
        />
      </div>
    );
  }

  const lesson = result.lesson;

  // The course payload supplies the sidebar curriculum with this viewer's
  // per-lesson accessibility already resolved by the API.
  const course = await getCourse(lesson.courseSlug);

  /*
   * CourseDetail carries the viewer's course-level progress percentage but
   * not a per-lesson completion flag, so the sidebar reports the percentage
   * and the lesson total — never a derived "x of y" completed count, which
   * would be an approximation presented as fact.
   */
  const progressPercent = course.viewerEnrollment?.progressPercent ?? 0;
  const totalLessons = course.lessonCount;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---- Slim learning header ---- */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center gap-4">
          <Link href="/" className="shrink-0 rounded-md transition-opacity hover:opacity-85">
            <Logo size="sm" markOnly className="sm:hidden" />
            <Logo size="sm" className="hidden sm:inline-flex" />
          </Link>

          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate text-sm font-semibold text-heading">{lesson.courseTitle}</p>
            <div className="mt-1 flex items-center gap-2">
              <Progress value={progressPercent} size="sm" className="max-w-40" />
              <span className="shrink-0 text-xs text-faint">{progressPercent}%</span>
            </div>
          </div>

          <div className="flex-1 sm:hidden" />

          <ThemeToggle className="hidden sm:inline-flex" />

          <Button href={`/courses/${lesson.courseSlug}`} variant="secondary" size="sm">
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.learn.backToCourse}</span>
          </Button>
        </div>
      </header>

      {/* ---- Body ---- */}
      <div className="container-page flex-1 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-10">
          <main id="main" className="min-w-0">
            <LessonPlayer lesson={lesson} />
          </main>

          {/* ---- Curriculum sidebar ---- */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-faint">
                {t.learn.courseContent}
              </h2>
              <span className="text-xs text-faint">
                {t.course.lessons(totalLessons)}
              </span>
            </div>
            <Curriculum
              modules={course.modules}
              courseSlug={course.slug}
              defaultOpenFirst={false}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

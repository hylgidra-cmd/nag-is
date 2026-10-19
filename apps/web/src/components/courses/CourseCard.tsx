import Link from 'next/link';
import { Clock, PlayCircle, Users } from 'lucide-react';
import { discountPercent, formatUzs, type CourseListItem } from '@nagis/shared-types';
import { formatDurationShort, t } from '@/i18n';
import { cn } from '@/lib/cn';
import { Badge, Card, Skeleton, Stars } from '@/components/ui/primitives';
import { CategoryIcon } from './CategoryIcon';

/**
 * Course card.
 *
 * Renders only fields the API actually returned. In particular:
 *  * the rating block is omitted entirely when `ratingAverage` is null, so a
 *    course with no reviews never shows an invented score;
 *  * `enrollmentCount` is shown only when above zero, so a new course does
 *    not advertise "0 oqıwshı".
 *
 * The whole card is one link, with the thumbnail zoom and lift driven by
 * `group-hover` so there is a single hit target.
 */
export function CourseCard({
  course,
  className,
  priority = false,
}: {
  course: CourseListItem;
  className?: string;
  /** Eager-load the image for above-the-fold cards. */
  priority?: boolean;
}) {
  const discount = discountPercent(course.priceUzs, course.comparePriceUzs);

  return (
    <Card
      interactive
      elevation="subtle"
      className={cn('group relative flex flex-col overflow-hidden', className)}
    >
      <Link
        href={`/courses/${course.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none"
      >
        {/* ---- Thumbnail ---- */}
        <div className="relative aspect-[16/9] overflow-hidden bg-surface-muted">
          <CourseThumbnail course={course} priority={priority} />

          {/* Price / discount chips */}
          <div className="absolute left-3 top-3 flex gap-1.5">
            {course.isFree ? (
              <Badge tone="success" className="shadow-subtle backdrop-blur">
                {t.course.free}
              </Badge>
            ) : (
              discount !== null && (
                <Badge tone="danger" className="shadow-subtle backdrop-blur">
                  {t.course.discount(discount)}
                </Badge>
              )
            )}
          </div>

          <div className="absolute right-3 top-3">
            <Badge tone="ink" size="sm" className="shadow-subtle backdrop-blur">
              {t.course.levelShort[course.level]}
            </Badge>
          </div>
        </div>

        {/* ---- Body ---- */}
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <CategoryIcon
              name={course.category.icon}
              accent={course.category.accent}
              className="h-6 w-6 shrink-0"
            />
            <span className="truncate text-xs font-medium text-muted">
              {course.category.name}
            </span>
          </div>

          <h3 className="line-clamp-2 text-base font-bold leading-snug text-heading transition-colors group-hover:text-accent-600">
            {course.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
            {course.summary}
          </p>

          <p className="mt-3 truncate text-xs text-faint">{course.instructor.fullName}</p>

          {/* ---- Meta row ---- */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-faint">
            <span className="inline-flex items-center gap-1">
              <PlayCircle aria-hidden="true" className="h-3.5 w-3.5" />
              {t.course.lessons(course.lessonCount)}
            </span>
            {course.durationMinutes > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                {formatDurationShort(course.durationMinutes)}
              </span>
            )}
            {course.enrollmentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users aria-hidden="true" className="h-3.5 w-3.5" />
                {course.enrollmentCount}
              </span>
            )}
          </div>

          {/* ---- Footer: rating + price ---- */}
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-hairline pt-3.5">
            {/* Only real ratings. */}
            {course.ratingAverage !== null ? (
              <Stars
                value={course.ratingAverage}
                count={course.ratingCount}
                emptyLabel={t.course.noRating}
              />
            ) : (
              <span className="text-xs text-faint">{t.course.noRating}</span>
            )}

            <div className="text-right">
              {course.isFree ? (
                <span className="text-base font-bold text-[var(--color-success)]">
                  {t.course.free}
                </span>
              ) : (
                <>
                  {course.comparePriceUzs !== null && (
                    <span className="mr-1.5 text-xs text-faint line-through">
                      {formatUzs(course.comparePriceUzs)}
                    </span>
                  )}
                  <span className="whitespace-nowrap text-base font-bold text-heading">
                    {formatUzs(course.priceUzs)}{' '}
                    <span className="text-xs font-medium text-muted">{t.course.currency}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}

/**
 * Thumbnail with a generated fallback.
 *
 * Most seeded courses have no image, so instead of a grey box the fallback
 * paints a deterministic gradient from the category accent plus the category
 * glyph. It looks intentional and stays distinguishable between cards.
 *
 * A plain <img> is used rather than next/image because thumbnail URLs are
 * administrator-supplied and arbitrary hosts are not in the optimiser
 * allowlist; next/image would hard-fail on an unlisted domain.
 */
function CourseThumbnail({
  course,
  priority,
}: {
  course: CourseListItem;
  priority: boolean;
}) {
  if (course.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={course.thumbnailUrl}
        alt={course.title}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    );
  }

  const accent = course.category.accent ?? '#2f66f6';

  return (
    <div
      aria-hidden="true"
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${accent} 16%, transparent) 0%, color-mix(in srgb, ${accent} 5%, transparent) 60%, transparent 100%)`,
      }}
    >
      {/* Faint grid, to echo the hero without shouting. */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <CategoryIcon
        name={course.category.icon}
        accent={accent}
        className="h-14 w-14 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    </div>
  );
}

/** Matches CourseCard's geometry so the grid does not jump when data lands. */
export function CourseCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2.5 flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-[0.625rem]" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-1.5 h-3 w-2/3" />
        <Skeleton className="mt-3 h-3 w-28" />
        <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3.5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </Card>
  );
}

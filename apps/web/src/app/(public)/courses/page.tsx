import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SearchX, ServerCrash } from 'lucide-react';
import { COURSE_LEVELS, COURSE_PRICE_FILTERS, COURSE_SORT_OPTIONS } from '@nagis/shared-types';
import { t } from '@/i18n';
import { getCategories, searchCourses, type CourseSearchParams } from '@/lib/api/server';
import { safely, settle } from '@/lib/api/safe';
import { Button } from '@/components/ui/Button';
import { StateBlock } from '@/components/ui/primitives';
import { CourseCard, CourseCardSkeleton } from '@/components/courses/CourseCard';
import { CatalogFilters } from '@/components/courses/CatalogFilters';
import { Pagination } from '@/components/courses/Pagination';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';

export const metadata: Metadata = {
  title: t.meta.coursesTitle,
  description: t.meta.coursesDescription,
};

/** Results depend on the query string, so this renders per request. */
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Course catalog.
 *
 * The query string is the single source of truth: `CatalogFilters` only
 * rewrites the URL, and this component re-reads it. That keeps filtered
 * results shareable and correct under browser back/forward.
 *
 * Note on the loading skeleton: it is an explicit `<Suspense>` around the
 * results, NOT a `loading.tsx`. A `loading.tsx` in this segment would also
 * wrap `courses/[slug]`, and the Suspense boundary it creates makes Next
 * commit a 200 before the detail page can raise `notFound()` — so a missing
 * course would render the right page with the wrong status. Keeping the
 * boundary inside this file confines streaming to the list.
 */
export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categories = await safely(getCategories, [], 'categories');

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-display-md sm:text-display-lg">{t.catalog.title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          {t.catalog.subtitle}
        </p>
      </header>

      {/*
        `key` ties the boundary to the active query, so changing a filter
        shows the skeleton again instead of holding the previous results.
      */}
      <Suspense
        key={JSON.stringify(params)}
        fallback={<CatalogFallback categories={categories} />}
      >
        <CatalogResults params={params} categories={categories} />
      </Suspense>
    </div>
  );
}

/** Fetches and renders the filtered page of courses. */
async function CatalogResults({
  params,
  categories,
}: {
  params: SearchParams;
  categories: Awaited<ReturnType<typeof getCategories>>;
}) {
  const query = normalise(params);
  const result = await settle(() => searchCourses(query));

  return (
    <>
      <CatalogFilters
        categories={categories}
        resultCount={result.ok ? result.data.meta.total : 0}
      />

      <div className="mt-8">
        {!result.ok ? (
          /* The API call genuinely failed. */
          <StateBlock
            tone="danger"
            icon={<ServerCrash className="h-5 w-5" />}
            title={t.catalog.error.title}
            description={t.catalog.error.description}
            action={
              <Button href="/courses" variant="secondary">
                {t.common.retry}
              </Button>
            }
          />
        ) : result.data.items.length === 0 ? (
          /* The call worked; nothing matched. */
          <StateBlock
            icon={<SearchX className="h-5 w-5" />}
            title={t.catalog.empty.title}
            description={t.catalog.empty.description}
            action={
              <Button href="/courses" variant="secondary">
                {t.catalog.empty.action}
              </Button>
            }
          />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.data.items.map((course, index) => (
                <Reveal as="li" key={course.id} delay={stagger(index, 0.04, 0.2)}>
                  <CourseCard course={course} className="h-full" priority={index < 6} />
                </Reveal>
              ))}
            </ul>

            <Pagination meta={result.data.meta} searchParams={params} className="mt-12" />
          </>
        )}
      </div>
    </>
  );
}

/**
 * Streaming fallback. The filter bar is rendered for real (it needs no
 * network), so controls stay usable while the grid loads.
 */
function CatalogFallback({
  categories,
}: {
  categories: Awaited<ReturnType<typeof getCategories>>;
}) {
  return (
    <>
      {/* null, not 0: the count is unknown while the grid streams. */}
      <CatalogFilters categories={categories} resultCount={null} />
      <div className="mt-8" aria-busy="true" aria-live="polite">
        <span className="sr-only">{t.common.loading}</span>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <CourseCardSkeleton className="h-full" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/**
 * Coerces raw search params into the shape the API expects.
 *
 * Unknown enum values are dropped rather than forwarded, so the rendered
 * filter chips stay honest about what was actually applied.
 */
function normalise(params: SearchParams): CourseSearchParams {
  const single = (key: string): string | undefined => {
    const value = params[key];
    if (Array.isArray(value)) return value[0];
    return value ?? undefined;
  };

  const levels = (() => {
    const raw = params['level'];
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const valid = list.filter((item) => (COURSE_LEVELS as readonly string[]).includes(item));
    return valid.length > 0 ? valid : undefined;
  })();

  const price = single('price');
  const sort = single('sort');
  const pageRaw = Number(single('page'));

  return {
    q: single('q')?.trim() || undefined,
    category: single('category') || undefined,
    level: levels,
    price:
      price && (COURSE_PRICE_FILTERS as readonly string[]).includes(price) ? price : undefined,
    sort: sort && (COURSE_SORT_OPTIONS as readonly string[]).includes(sort) ? sort : undefined,
    page: Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1,
    perPage: 12,
  };
}

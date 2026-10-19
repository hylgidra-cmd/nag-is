'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  COURSE_LEVELS,
  COURSE_PRICE_FILTERS,
  COURSE_SORT_OPTIONS,
  type CategoryDto,
  type CourseLevel,
} from '@nagis/shared-types';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';

/**
 * Catalog filter bar.
 *
 * All state lives in the URL, not in component state. That makes a filtered
 * result shareable, bookmarkable and correct under browser back/forward, and
 * it means the server component below re-renders from the query string as the
 * single source of truth.
 *
 * The free-text search is debounced so typing does not fire a request per
 * keystroke; every other control navigates immediately.
 */

const SEARCH_DEBOUNCE_MS = 350;

export function CatalogFilters({
  categories,
  resultCount,
}: {
  categories: CategoryDto[];
  /** null while the result set is still loading — not "zero results". */
  resultCount: number | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = params.get('q') ?? '';
  const currentCategory = params.get('category') ?? '';
  const currentPrice = params.get('price') ?? 'all';
  const currentSort = params.get('sort') ?? 'newest';
  const currentLevels = params.getAll('level').filter(isCourseLevel);

  // Local mirror of the search box, so typing stays responsive while the
  // navigation it triggers is debounced.
  const [searchText, setSearchText] = useState(currentQuery);
  const [panelOpen, setPanelOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Rebuilds the query string from the current URL plus an override.
   * `page` is always dropped: changing a filter must return to page 1, or the
   * user can land on an out-of-range page with no results.
   */
  const navigate = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete('page');
      const serialised = next.toString();
      startTransition(() => {
        router.push(serialised ? `/courses?${serialised}` : '/courses', { scroll: false });
      });
    },
    [params, router],
  );

  // Debounced search. The timer is cleared on unmount so a pending
  // navigation cannot fire after the user has left the page.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function onSearchChange(value: string) {
    setSearchText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate((next) => {
        const trimmed = value.trim();
        if (trimmed) {
          next.set('q', trimmed);
        } else {
          next.delete('q');
        }
      });
    }, SEARCH_DEBOUNCE_MS);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate((next) => {
      const trimmed = searchText.trim();
      if (trimmed) {
        next.set('q', trimmed);
      } else {
        next.delete('q');
      }
    });
  }

  function toggleLevel(level: CourseLevel) {
    navigate((next) => {
      const existing = next.getAll('level');
      next.delete('level');
      const updated = existing.includes(level)
        ? existing.filter((item) => item !== level)
        : [...existing, level];
      for (const item of updated) next.append('level', item);
    });
  }

  function clearAll() {
    setSearchText('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    startTransition(() => router.push('/courses', { scroll: false }));
  }

  const activeCount =
    (currentQuery ? 1 : 0) +
    (currentCategory ? 1 : 0) +
    currentLevels.length +
    (currentPrice !== 'all' ? 1 : 0);

  const selectedCategory = categories.find((category) => category.slug === currentCategory);

  return (
    <div className="space-y-4">
      {/* ---- Search + sort row ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={submitSearch} role="search" className="relative flex-1">
          <label htmlFor="catalog-search" className="sr-only">
            {t.catalog.searchLabel}
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          />
          <input
            id="catalog-search"
            type="search"
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t.catalog.searchPlaceholder}
            className="h-11 w-full rounded-card border border-hairline bg-surface pl-10 pr-10 text-sm text-body transition-[border-color,box-shadow] placeholder:text-faint focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-accent-500)_22%,transparent)]"
          />
          {/* Inline pending indicator: the list below is updating. */}
          {isPending && (
            <Loader2
              aria-hidden="true"
              className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent-600 motion-reduce:animate-none"
            />
          )}
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="catalog-sort" className="sr-only">
            {t.catalog.sortLabel}
          </label>
          <Select
            id="catalog-sort"
            value={currentSort}
            onChange={(event) =>
              navigate((next) => next.set('sort', event.target.value))
            }
            className="h-11 w-full sm:w-52"
          >
            {COURSE_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t.catalog.sort[option]}
              </option>
            ))}
          </Select>

          {/* Mobile: filters collapse behind a toggle. */}
          <Button
            variant="secondary"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-controls="catalog-filter-panel"
            className="shrink-0 lg:hidden"
          >
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            {t.common.filters}
            {activeCount > 0 && (
              <Badge tone="accent" size="sm">
                {activeCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* ---- Filter controls ---- */}
      <div
        id="catalog-filter-panel"
        className={cn(
          'grid gap-4 rounded-panel border border-hairline bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto] lg:items-end',
          !panelOpen && 'hidden lg:grid',
        )}
      >
        {/* Category */}
        <div className="space-y-1.5">
          <label
            htmlFor="catalog-category"
            className="block text-xs font-semibold uppercase tracking-wider text-faint"
          >
            {t.catalog.categoryLabel}
          </label>
          <Select
            id="catalog-category"
            value={currentCategory}
            onChange={(event) =>
              navigate((next) => {
                if (event.target.value) {
                  next.set('category', event.target.value);
                } else {
                  next.delete('category');
                }
              })
            }
          >
            <option value="">{t.catalog.categoryAll}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name} ({category.courseCount})
              </option>
            ))}
          </Select>
        </div>

        {/* Level — multi-select pills */}
        <fieldset className="space-y-1.5">
          <legend className="block text-xs font-semibold uppercase tracking-wider text-faint">
            {t.catalog.levelLabel}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {COURSE_LEVELS.map((level) => {
              const active = currentLevels.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-pill border px-3 py-2 text-xs font-medium transition-colors',
                    active
                      ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200'
                      : 'border-hairline text-muted hover:bg-surface-muted hover:text-heading',
                  )}
                >
                  {t.course.level[level]}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Price — single choice */}
        <fieldset className="space-y-1.5">
          <legend className="block text-xs font-semibold uppercase tracking-wider text-faint">
            {t.catalog.priceLabel}
          </legend>
          <div className="flex gap-1.5">
            {COURSE_PRICE_FILTERS.map((option) => {
              const active = currentPrice === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    navigate((next) => {
                      if (option === 'all') {
                        next.delete('price');
                      } else {
                        next.set('price', option);
                      }
                    })
                  }
                  aria-pressed={active}
                  className={cn(
                    'rounded-pill border px-3 py-2 text-xs font-medium transition-colors',
                    active
                      ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200'
                      : 'border-hairline text-muted hover:bg-surface-muted hover:text-heading',
                  )}
                >
                  {t.catalog.price[option]}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* ---- Active filter chips + count ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <p aria-live="polite" className="mr-1 text-sm text-muted">
          {resultCount === null
            ? t.common.loading
            : resultCount === 0
              ? t.catalog.resultCountZero
              : t.catalog.resultCount(resultCount)}
        </p>

        {currentQuery && (
          <FilterChip
            label={`“${currentQuery}”`}
            onRemove={() => {
              setSearchText('');
              navigate((next) => next.delete('q'));
            }}
          />
        )}
        {selectedCategory && (
          <FilterChip
            label={selectedCategory.name}
            onRemove={() => navigate((next) => next.delete('category'))}
          />
        )}
        {currentLevels.map((level) => (
          <FilterChip
            key={level}
            label={t.course.level[level]}
            onRemove={() => toggleLevel(level)}
          />
        ))}
        {currentPrice !== 'all' && isPriceFilter(currentPrice) && (
          <FilterChip
            label={t.catalog.price[currentPrice]}
            onRemove={() => navigate((next) => next.delete('price'))}
          />
        )}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 text-xs font-medium text-accent-600 underline-offset-4 hover:underline"
          >
            {t.common.clearFilters}
          </button>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-hairline bg-surface-muted py-1 pl-2.5 pr-1 text-xs font-medium text-body">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-pill text-faint transition-colors hover:bg-ink-200 hover:text-heading dark:hover:bg-ink-600"
      >
        <X aria-hidden="true" className="h-3 w-3" />
        <span className="sr-only">
          {t.catalog.removeFilter(label)}
        </span>
      </button>
    </span>
  );
}

function isCourseLevel(value: string): value is CourseLevel {
  return (COURSE_LEVELS as readonly string[]).includes(value);
}

function isPriceFilter(value: string): value is (typeof COURSE_PRICE_FILTERS)[number] {
  return (COURSE_PRICE_FILTERS as readonly string[]).includes(value);
}

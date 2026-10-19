import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Paginated } from '@nagis/shared-types';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

type Meta = Paginated<unknown>['meta'];

/**
 * Pagination as real links.
 *
 * Each page is an `<a href>` carrying the full query string, so pages are
 * crawlable, middle-clickable and restorable from history — which a
 * button-plus-router implementation would not be.
 */
export function Pagination({
  meta,
  searchParams,
  className,
}: {
  meta: Meta;
  /** Current filter state, preserved across page links. */
  searchParams: Record<string, string | string[] | undefined>;
  className?: string;
}) {
  if (meta.totalPages <= 1) return null;

  const href = (page: number): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === 'page' || value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) params.append(key, item);
      } else {
        params.set(key, value);
      }
    }
    if (page > 1) params.set('page', String(page));
    const serialised = params.toString();
    return serialised ? `/courses?${serialised}` : '/courses';
  };

  const pages = pageWindow(meta.page, meta.totalPages);

  return (
    <nav aria-label={t.catalog.pagination.label} className={cn('flex justify-center', className)}>
      <ul className="flex items-center gap-1">
        <li>
          {meta.hasPrev ? (
            <Link href={href(meta.page - 1)} className={arrowClasses(false)} scroll>
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">{t.catalog.pagination.previous}</span>
            </Link>
          ) : (
            <span aria-disabled="true" className={arrowClasses(true)}>
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">{t.catalog.pagination.previous}</span>
            </span>
          )}
        </li>

        {pages.map((page, index) =>
          page === null ? (
            // Gap marker. aria-hidden because it conveys nothing to a reader.
            <li key={`gap-${index}`} aria-hidden="true" className="px-1.5 text-faint">
              …
            </li>
          ) : (
            <li key={page}>
              <Link
                href={href(page)}
                aria-current={page === meta.page ? 'page' : undefined}
                scroll
                className={cn(
                  'flex h-10 min-w-10 items-center justify-center rounded-card border px-3 text-sm font-medium transition-colors',
                  page === meta.page
                    ? 'border-ink-900 bg-ink-900 text-white dark:border-accent-600 dark:bg-accent-600'
                    : 'border-hairline text-body hover:bg-surface-muted hover:text-heading',
                )}
              >
                {page}
              </Link>
            </li>
          ),
        )}

        <li>
          {meta.hasNext ? (
            <Link href={href(meta.page + 1)} className={arrowClasses(false)} scroll>
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">{t.catalog.pagination.next}</span>
            </Link>
          ) : (
            <span aria-disabled="true" className={arrowClasses(true)}>
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">{t.catalog.pagination.next}</span>
            </span>
          )}
        </li>
      </ul>

      <p className="sr-only" aria-live="polite">
        {t.catalog.pagination.pageOf(meta.page, meta.totalPages)}
      </p>
    </nav>
  );
}

function arrowClasses(disabled: boolean): string {
  return cn(
    'flex h-10 w-10 items-center justify-center rounded-card border border-hairline transition-colors',
    disabled
      ? 'cursor-not-allowed text-faint opacity-50'
      : 'text-body hover:bg-surface-muted hover:text-heading',
  );
}

/**
 * Builds a compact page list: always the first and last page, a window around
 * the current one, and `null` where pages are skipped.
 */
function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current]);
  for (const offset of [-1, 1]) {
    const candidate = current + offset;
    if (candidate > 1 && candidate < total) pages.add(candidate);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index];
    if (page === undefined) continue;
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous > 1) out.push(null);
    out.push(page);
  }

  return out;
}

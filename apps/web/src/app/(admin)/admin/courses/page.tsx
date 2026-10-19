import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Plus, ServerCrash } from 'lucide-react';
import { formatUzs } from '@nagis/shared-types';
import { formatDate, t } from '@/i18n';
import { cn } from '@/lib/cn';
import { getAdminCategories, getAdminCourses } from '@/lib/api/server';
import { safely, settle } from '@/lib/api/safe';
import { Badge, Card, Stars, StateBlock } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { AdminCourseFilters } from '@/components/admin/AdminCourseFilters';

export const metadata: Metadata = { title: t.admin.courses.title };
export const dynamic = 'force-dynamic';

const STATUS_TONE = {
  PUBLISHED: 'success',
  DRAFT: 'warning',
  ARCHIVED: 'neutral',
} as const;

/**
 * Course management.
 *
 * Unlike the public catalog this lists drafts and archived courses too, which
 * is only possible because the request goes to `/admin/courses` — an
 * ADMIN-only endpoint.
 */
export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page);

  const [categories, result] = await Promise.all([
    safely(getAdminCategories, [], 'admin categories'),
    settle(() =>
      getAdminCourses({
        q: params.q,
        status: params.status,
        page: Number.isFinite(page) && page >= 1 ? page : 1,
        perPage: 20,
      }),
    ),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-display-sm sm:text-display-md">{t.admin.courses.title}</h1>
          {result.ok && (
            <p className="mt-2 text-sm text-muted">
              {t.catalog.resultCount(result.data.meta.total)}
            </p>
          )}
        </div>
        <Button href="/admin/courses/new" variant="primary">
          <Plus aria-hidden="true" className="h-4 w-4" />
          {t.admin.courses.create}
        </Button>
      </header>

      <AdminCourseFilters />

      {!result.ok ? (
        <StateBlock
          tone="danger"
          icon={<ServerCrash className="h-5 w-5" />}
          title={t.errorPage.title}
          description={result.error}
        />
      ) : result.data.items.length === 0 ? (
        <StateBlock
          icon={<BookOpen className="h-5 w-5" />}
          title={t.admin.courses.empty.title}
          description={t.admin.courses.empty.description}
          action={
            <Button href="/admin/courses/new" variant="primary">
              {t.admin.courses.empty.action}
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Horizontal scroll rather than hiding columns, so no data is lost
              on a narrow screen. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="border-b border-hairline bg-surface-muted/60">
                <tr>
                  <Th>{t.admin.courses.table.title}</Th>
                  <Th>{t.admin.courses.table.category}</Th>
                  <Th>{t.admin.courses.table.level}</Th>
                  <Th align="right">{t.admin.courses.table.price}</Th>
                  <Th align="center">{t.admin.courses.table.lessons}</Th>
                  <Th align="center">{t.admin.courses.table.enrollments}</Th>
                  <Th>{t.admin.courses.table.rating}</Th>
                  <Th align="center">{t.admin.courses.table.status}</Th>
                  <Th>{t.admin.courses.table.updated}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-hairline)]">
                {result.data.items.map((course) => (
                  <tr key={course.id} className="transition-colors hover:bg-surface-muted/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="font-medium text-heading underline-offset-4 hover:text-accent-600 hover:underline"
                      >
                        {course.title}
                      </Link>
                      <span className="mt-0.5 block font-mono text-[11px] text-faint">
                        {course.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{course.category.name}</td>
                    <td className="px-4 py-3 text-muted">
                      {t.course.levelShort[course.level]}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-heading">
                      {course.isFree ? t.course.free : formatUzs(course.priceUzs)}
                    </td>
                    <td className="px-4 py-3 text-center text-muted">{course.lessonCount}</td>
                    <td className="px-4 py-3 text-center text-muted">
                      {course.enrollmentCount}
                    </td>
                    <td className="px-4 py-3">
                      <Stars
                        value={course.ratingAverage}
                        count={course.ratingCount}
                        emptyLabel="—"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        tone={STATUS_TONE[course.status as keyof typeof STATUS_TONE] ?? 'neutral'}
                        size="sm"
                      >
                        {t.course.status[course.status as keyof typeof t.course.status]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-faint">
                      {formatDate(course.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {categories.length === 0 && (
        <p className="text-sm text-muted">
          {t.admin.categories.empty.description}{' '}
          <Link
            href="/admin/categories"
            className="font-medium text-accent-600 underline-offset-4 hover:underline"
          >
            {t.admin.categories.create}
          </Link>
        </p>
      )}
    </div>
  );
}

/**
 * Table header cell.
 *
 * The alignment is a lookup rather than `text-${align}`: Tailwind extracts
 * class names statically, so an interpolated class never reaches the
 * generated CSS.
 */
const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: keyof typeof ALIGN;
}) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-faint',
        ALIGN[align],
      )}
    >
      {children}
    </th>
  );
}

import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { t } from '@/i18n';
import { getAdminCategories, getAdminCourse } from '@/lib/api/server';
import { isApiError } from '@/lib/api/errors';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { CourseForm } from '@/components/admin/CourseForm';
import { Curriculum } from '@/components/courses/Curriculum';

export const dynamic = 'force-dynamic';

/** Deduped between metadata and the page; 404s inside so the status is right. */
const loadCourse = cache(async (id: string) => {
  try {
    return await getAdminCourse(id);
  } catch (error) {
    if (isApiError(error) && (error.isNotFound || error.isForbidden)) notFound();
    throw error;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = await loadCourse(id);
  return { title: `${course.title} · ${t.admin.courses.edit}` };
}

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [course, categories] = await Promise.all([loadCourse(id), getAdminCategories()]);

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <li>
            <Link href="/admin/courses" className="transition-colors hover:text-accent-600">
              {t.admin.nav.courses}
            </Link>
          </li>
          <ChevronRight aria-hidden="true" className="h-3 w-3 text-faint" />
          <li className="truncate text-heading">{course.title}</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Badge
              tone={
                course.status === 'PUBLISHED'
                  ? 'success'
                  : course.status === 'DRAFT'
                    ? 'warning'
                    : 'neutral'
              }
              size="sm"
            >
              {t.course.status[course.status]}
            </Badge>
            <span className="font-mono text-xs text-faint">{course.slug}</span>
          </div>
          <h1 className="text-display-sm">{t.admin.courses.edit}</h1>
        </div>

        {course.status === 'PUBLISHED' && (
          <Button href={`/courses/${course.slug}`} variant="secondary" size="sm">
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            {t.common.view}
          </Button>
        )}
      </header>

      <CourseForm categories={categories} course={course} />

      {/* ---- Curriculum (read-only view of the current structure) ---- */}
      <section className="pt-2">
        <h2 className="mb-1 text-display-sm">{t.admin.courses.curriculum.title}</h2>
        <p className="mb-4 text-sm text-muted">{t.admin.courses.curriculum.subtitle}</p>

        {course.modules.length === 0 ? (
          <p className="rounded-card border border-dashed border-hairline bg-surface-muted/50 px-4 py-8 text-center text-sm text-muted">
            {t.admin.courses.curriculum.empty}
          </p>
        ) : (
          <Curriculum modules={course.modules} courseSlug={course.slug} />
        )}

        {/*
          Module and lesson editing exists on the API
          (POST/PATCH/DELETE /admin/modules and /admin/lessons, plus the
          reorder endpoints) but has no UI yet. The endpoints are named here
          rather than shown as buttons that do nothing.
        */}
        <p className="mt-4 rounded-card border border-dashed border-hairline bg-surface-muted/60 px-4 py-3 text-xs leading-relaxed text-muted">
          {t.admin.courses.curriculum.apiOnlyNotice}
          <span className="mt-1.5 block font-mono text-[11px] text-faint">
            POST /api/v1/admin/modules · POST /api/v1/admin/lessons ·
            POST /api/v1/admin/courses/:id/modules/reorder
          </span>
        </p>
      </section>
    </div>
  );
}

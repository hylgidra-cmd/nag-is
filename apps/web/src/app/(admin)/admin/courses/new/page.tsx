import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { t } from '@/i18n';
import { getAdminCategories } from '@/lib/api/server';
import { StateBlock } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { CourseForm } from '@/components/admin/CourseForm';

export const metadata: Metadata = { title: t.admin.courses.create };
export const dynamic = 'force-dynamic';

export default async function NewCoursePage() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs text-muted">
          <li>
            <Link href="/admin/courses" className="transition-colors hover:text-accent-600">
              {t.admin.nav.courses}
            </Link>
          </li>
          <ChevronRight aria-hidden="true" className="h-3 w-3 text-faint" />
          <li className="text-heading">{t.admin.courses.create}</li>
        </ol>
      </nav>

      <h1 className="text-display-sm sm:text-display-md">{t.admin.courses.create}</h1>

      {categories.length === 0 ? (
        <StateBlock
          title={t.admin.categories.empty.title}
          description={t.admin.categories.empty.description}
          action={
            <Button href="/admin/categories" variant="primary">
              {t.admin.categories.create}
            </Button>
          }
        />
      ) : (
        <CourseForm categories={categories} />
      )}
    </div>
  );
}

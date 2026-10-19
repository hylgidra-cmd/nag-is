import type { Metadata } from 'next';
import { ServerCrash } from 'lucide-react';
import { t } from '@/i18n';
import { getAdminCategories } from '@/lib/api/server';
import { settle } from '@/lib/api/safe';
import { StateBlock } from '@/components/ui/primitives';
import { CategoryManager } from '@/components/admin/CategoryManager';

export const metadata: Metadata = { title: t.admin.categories.title };
export const dynamic = 'force-dynamic';

/**
 * Category management.
 *
 * Categories drive the public catalog filters and the landing grid, so this is
 * the screen that makes the taxonomy editable without a deploy.
 */
export default async function AdminCategoriesPage() {
  const result = await settle(getAdminCategories);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display-sm sm:text-display-md">{t.admin.categories.title}</h1>
        <p className="mt-2 text-base text-muted">{t.admin.subtitle}</p>
      </header>

      {result.ok ? (
        <CategoryManager categories={result.data} />
      ) : (
        <StateBlock
          tone="danger"
          icon={<ServerCrash className="h-5 w-5" />}
          title={t.errorPage.title}
          description={result.error}
        />
      )}
    </div>
  );
}

import type { Metadata } from 'next';
import { ServerCrash, Users } from 'lucide-react';
import { t } from '@/i18n';
import { getAdminUsers } from '@/lib/api/server';
import { settle } from '@/lib/api/safe';
import { StateBlock } from '@/components/ui/primitives';
import { UserTable } from '@/components/admin/UserTable';
import { AdminUserFilters } from '@/components/admin/AdminUserFilters';

export const metadata: Metadata = { title: t.admin.users.title };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page);

  const result = await settle(() =>
    getAdminUsers({
      q: params.q,
      role: params.role,
      page: Number.isFinite(page) && page >= 1 ? page : 1,
      perPage: 25,
    }),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display-sm sm:text-display-md">{t.admin.users.title}</h1>
        {result.ok && (
          <p className="mt-2 text-sm text-muted">
            {t.catalog.resultCount(result.data.meta.total)}
          </p>
        )}
      </header>

      <AdminUserFilters />

      {!result.ok ? (
        <StateBlock
          tone="danger"
          icon={<ServerCrash className="h-5 w-5" />}
          title={t.errorPage.title}
          description={result.error}
        />
      ) : result.data.items.length === 0 ? (
        <StateBlock
          icon={<Users className="h-5 w-5" />}
          title={t.admin.users.empty.title}
          description={t.admin.users.empty.description}
        />
      ) : (
        <UserTable users={result.data.items} />
      )}
    </div>
  );
}

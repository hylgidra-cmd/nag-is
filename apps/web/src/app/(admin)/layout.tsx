import { redirect } from 'next/navigation';
import { getCategories, getCurrentUser } from '@/lib/api/server';
import { safely } from '@/lib/api/safe';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { Navbar } from '@/components/layout/Navbar';
import { AdminNav } from '@/components/admin/AdminNav';

/**
 * Administrative area shell.
 *
 * The role check here is a *redirect*, not the access control: every
 * /api/v1/admin/* endpoint is guarded by RolesGuard on the server, so a
 * student who reaches these routes sees empty panels and 403s rather than
 * data. This just avoids showing them a broken page.
 */
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, categories] = await Promise.all([
    safely(getCurrentUser, null, 'session'),
    safely(getCategories, [], 'categories'),
  ]);

  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  return (
    <SessionProvider initialUser={user}>
      <div className="flex min-h-dvh flex-col">
        <Navbar categories={categories} />

        <div className="container-page flex-1 py-8">
          <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-10">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <AdminNav />
            </aside>
            <main id="main" className="min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}

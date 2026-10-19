import { redirect } from 'next/navigation';
import { getCategories, getCurrentUser } from '@/lib/api/server';
import { safely } from '@/lib/api/safe';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { Navbar } from '@/components/layout/Navbar';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

/**
 * Student area shell.
 *
 * Requires a session: an anonymous visitor is redirected to /login with
 * `?next=` so they return here afterwards. This is a convenience redirect,
 * not the security boundary — every /me endpoint is private server-side, so a
 * missing session would fail at the API regardless.
 */
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, categories] = await Promise.all([
    safely(getCurrentUser, null, 'session'),
    safely(getCategories, [], 'categories'),
  ]);

  if (!user) redirect('/login?next=/dashboard');

  return (
    <SessionProvider initialUser={user}>
      <div className="flex min-h-dvh flex-col">
        <Navbar categories={categories} />

        <div className="container-page flex-1 py-8">
          <div className="grid gap-8 lg:grid-cols-[14rem_1fr] lg:gap-10">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <DashboardNav />
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

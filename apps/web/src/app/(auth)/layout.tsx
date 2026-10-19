import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api/server';
import { safely } from '@/lib/api/safe';
import { SessionProvider } from '@/components/auth/SessionProvider';

/**
 * Authentication routes.
 *
 * Deliberately has no navbar or footer: these pages are a focused task, and
 * the shared chrome would offer links away from it.
 *
 * An already-signed-in visitor is redirected to the dashboard — reaching
 * /login with a live session is almost always a stale bookmark.
 */
export const dynamic = 'force-dynamic';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await safely(getCurrentUser, null, 'session');

  if (user) redirect('/dashboard');

  return <SessionProvider initialUser={null}>{children}</SessionProvider>;
}

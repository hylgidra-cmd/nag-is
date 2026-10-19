import { getCategories, getCurrentUser } from '@/lib/api/server';
import { safely } from '@/lib/api/safe';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

/**
 * Every public page is rendered per request.
 *
 * The navigation is personalised from the session cookie, so a statically
 * prerendered shell would show the signed-out navbar to signed-in visitors.
 * The underlying catalog reads are still cached (see `revalidate` in
 * lib/api/server.ts), so this costs a cheap render rather than a cold API hit.
 */
export const dynamic = 'force-dynamic';

/**
 * Shell for every public page.
 *
 * The session is resolved on the server and handed to SessionProvider, so the
 * first paint already shows the correct navigation — no flash of "sign in"
 * for a signed-in visitor, and no client-side token handling.
 *
 * Both reads are wrapped: if the API is down the marketing site still renders,
 * just without category links and in its anonymous state.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [categories, user] = await Promise.all([
    safely(getCategories, [], 'categories'),
    safely(getCurrentUser, null, 'session'),
  ]);

  return (
    <SessionProvider initialUser={user}>
      <div className="flex min-h-dvh flex-col">
        <Navbar categories={categories} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer categories={categories} />
      </div>
    </SessionProvider>
  );
}

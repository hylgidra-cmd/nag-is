'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicUser } from '@nagis/shared-types';
import { api } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';

/**
 * Client-side session state.
 *
 * The access and refresh tokens are HttpOnly cookies — this provider never
 * sees them and nothing is written to localStorage or sessionStorage. It holds
 * only the public user object, which the server seeded during render, so the
 * first paint already knows whether someone is signed in (no flash of the
 * wrong navbar).
 *
 * `refresh()` re-reads /me; `signOut()` asks the API to clear the cookies.
 */

interface SessionValue {
  user: PublicUser | null;
  /** True while a sign-out or refresh is in flight. */
  pending: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refresh: () => Promise<PublicUser | null>;
  signOut: () => Promise<void>;
  /** Lets a sign-in form publish the new user without a round trip. */
  setUser: (user: PublicUser | null) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: PublicUser | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<PublicUser | null>(initialUser);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const refresh = useCallback(async (): Promise<PublicUser | null> => {
    try {
      const next = await api.get<PublicUser>('/me');
      setUser(next);
      return next;
    } catch (error) {
      // A 401 here is the normal "not signed in" answer, not a failure.
      if (isApiError(error) && error.isUnauthorized) {
        setUser(null);
        return null;
      }
      throw error;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setPending(true);
    try {
      await api.post<void>('/auth/logout');
    } catch {
      // Even if the call fails the local session must end, so the user is
      // never stuck looking signed in with a dead cookie.
    } finally {
      setUser(null);
      setPending(false);
      // Clear any server-rendered, session-dependent output.
      router.refresh();
      router.push('/');
    }
  }, [router]);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      pending,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMIN',
      refresh,
      signOut,
      setUser,
    }),
    [user, pending, refresh, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside a <SessionProvider>.');
  }
  return context;
}

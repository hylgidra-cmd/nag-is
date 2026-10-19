'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { t } from '@/i18n';
import { api } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/auth/SessionProvider';

/**
 * Bookmark toggle, backed by `POST`/`DELETE /me/saved-courses/:courseId`.
 *
 * The saved state is held locally after the first toggle so the button
 * responds immediately, and `router.refresh()` re-syncs the server-rendered
 * pages (the dashboard "saved" tab) behind it. An anonymous visitor is sent
 * to sign in with a return path rather than shown a failing action.
 */
export function SaveCourseButton({
  courseId,
  courseSlug,
  initialSaved,
}: {
  courseId: string;
  courseSlug: string;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`);
      return;
    }

    const next = !saved;
    setPending(true);
    // Optimistic: the only realistic failure is a lapsed session, which is
    // handled below by reverting.
    setSaved(next);

    try {
      if (next) {
        await api.post<unknown>(`/me/saved-courses/${courseId}`);
      } else {
        await api.delete<unknown>(`/me/saved-courses/${courseId}`);
      }
      router.refresh();
    } catch (error) {
      setSaved(!next);
      if (isApiError(error) && error.isUnauthorized) {
        router.push(`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      full
      loading={pending}
      onClick={() => void toggle()}
      aria-pressed={saved}
    >
      {saved ? (
        <BookmarkCheck aria-hidden="true" className="h-3.5 w-3.5" />
      ) : (
        <Bookmark aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {saved ? t.course.saved : t.course.save}
    </Button>
  );
}

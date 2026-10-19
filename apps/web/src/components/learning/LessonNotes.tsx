'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, NotebookPen } from 'lucide-react';
import { t } from '@/i18n';
import { api } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { Card } from '@/components/ui/primitives';
import { Textarea } from '@/components/ui/Field';
import { FormError } from '@/components/ui/Field';

const AUTOSAVE_DELAY_MS = 1200;

/**
 * Private per-lesson notes, autosaved.
 *
 * Saving is debounced so typing does not fire a request per keystroke, and
 * the pending timer is flushed on unmount so navigating away mid-sentence
 * does not lose the last edit. Notes live in LessonProgress, scoped to the
 * user by the API — they are never visible to anyone else.
 */
export function LessonNotes({
  lessonId,
  initialNotes,
}: {
  lessonId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors `notes` so the unmount flush can read the latest value without
  // re-creating the effect on every keystroke.
  const latestRef = useRef(initialNotes);
  const savedRef = useRef(initialNotes);

  const save = useCallback(
    async (value: string) => {
      if (value === savedRef.current) return;
      setState('saving');
      setError('');
      try {
        await api.patch<unknown>(`/lessons/${lessonId}/progress`, { notes: value });
        savedRef.current = value;
        setState('saved');
      } catch (caught) {
        setState('error');
        setError(isApiError(caught) ? caught.localisedMessage : t.errors.INTERNAL);
      }
    },
    [lessonId],
  );

  function onChange(value: string) {
    setNotes(value);
    latestRef.current = value;
    setState('idle');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(value), AUTOSAVE_DELAY_MS);
  }

  // Flush any pending edit when leaving the lesson.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const pending = latestRef.current;
      if (pending !== savedRef.current) {
        // Fire-and-forget: the component is unmounting, so there is nothing
        // left to update. keepalive lets the request outlive the page.
        void api.patch<unknown>(`/lessons/${lessonId}/progress`, { notes: pending }).catch(() => {
          // Nothing useful to show — the UI is already gone.
        });
      }
    };
  }, [lessonId]);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-faint">
          <NotebookPen aria-hidden="true" className="h-3.5 w-3.5" />
          {t.learn.notesTitle}
        </h2>

        <span aria-live="polite" className="text-xs text-faint">
          {state === 'saving' && (
            <span className="inline-flex items-center gap-1.5">
              <Loader2
                aria-hidden="true"
                className="h-3 w-3 animate-spin motion-reduce:animate-none"
              />
              {t.common.saving}
            </span>
          )}
          {state === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-success)]">
              <Check aria-hidden="true" className="h-3 w-3" />
              {t.learn.notesSaved}
            </span>
          )}
        </span>
      </div>

      <Textarea
        value={notes}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t.learn.notesPlaceholder}
        rows={5}
        className="mt-3"
        aria-label={t.learn.notesTitle}
      />

      <p className="mt-2 text-xs text-faint">{t.learn.notesHint}</p>

      {state === 'error' && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}
    </Card>
  );
}

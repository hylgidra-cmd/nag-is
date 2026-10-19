'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, FileText, HelpCircle, Lock, PlayCircle } from 'lucide-react';
import type { CourseModuleSummary, LessonSummary, LessonType } from '@nagis/shared-types';
import { formatDurationShort, t } from '@/i18n';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/primitives';

const LESSON_ICON: Record<LessonType, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  ARTICLE: FileText,
  QUIZ: HelpCircle,
};

/**
 * Course curriculum, module by module.
 *
 * Accessibility of each lesson comes from `lesson.isAccessible`, which the API
 * computed for this specific viewer. Nothing here re-derives access from the
 * price or the enrollment — the client only renders the server's decision, and
 * a locked lesson is not a link at all, so there is no URL to poke at. The
 * lesson route re-checks on the server regardless.
 */
export function Curriculum({
  modules,
  courseSlug,
  /** Opens the first module by default on the course page. */
  defaultOpenFirst = true,
}: {
  modules: CourseModuleSummary[];
  courseSlug: string;
  defaultOpenFirst?: boolean;
}) {
  const [open, setOpen] = useState<Set<string>>(() => {
    const first = modules[0];
    return defaultOpenFirst && first ? new Set([first.id]) : new Set();
  });
  const reduceMotion = useReducedMotion();

  function toggle(id: string) {
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (modules.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-hairline bg-surface-muted/50 px-4 py-8 text-center text-sm text-muted">
        {t.errors.COURSE_HAS_NO_LESSONS}
      </p>
    );
  }

  return (
    <div className="divide-y divide-[var(--surface-hairline)] overflow-hidden rounded-panel border border-hairline bg-surface">
      {modules.map((courseModule, moduleIndex) => {
        const expanded = open.has(courseModule.id);
        const panelId = `module-panel-${courseModule.id}`;
        const buttonId = `module-button-${courseModule.id}`;

        return (
          <div key={courseModule.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                onClick={() => toggle(courseModule.id)}
                aria-expanded={expanded}
                aria-controls={panelId}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-muted sm:px-5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-surface-muted text-xs font-bold text-muted">
                  {moduleIndex + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-semibold leading-snug text-heading">
                    {courseModule.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-faint">
                    {t.course.lessons(courseModule.lessons.length)}
                    {courseModule.durationMinutes > 0 && (
                      <> · {formatDurationShort(courseModule.durationMinutes)}</>
                    )}
                  </span>
                </span>

                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'h-4 w-4 shrink-0 text-faint transition-transform duration-300 motion-reduce:transition-none',
                    expanded && 'rotate-180',
                  )}
                />
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduceMotion ? { height: 'auto' } : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduceMotion ? { height: 'auto' } : { height: 0, opacity: 0 }}
                  transition={
                    reduceMotion ? { duration: 0 } : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="overflow-hidden"
                >
                  <ul className="border-t border-hairline bg-surface-muted/35">
                    {courseModule.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <LessonRow lesson={lesson} courseSlug={courseSlug} />
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function LessonRow({ lesson, courseSlug }: { lesson: LessonSummary; courseSlug: string }) {
  const Icon = LESSON_ICON[lesson.type];

  const body = (
    <>
      <Icon
        aria-hidden="true"
        className={cn(
          'h-4 w-4 shrink-0',
          lesson.isAccessible ? 'text-accent-600' : 'text-faint',
        )}
      />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          lesson.isAccessible ? 'text-body' : 'text-muted',
        )}
      >
        {lesson.title}
      </span>

      {/* A preview lesson is watchable without enrolling, so say so. The old
          `&& !isAccessible` guard meant the badge never rendered, because a
          preview lesson is always accessible. */}
      {lesson.isPreview && (
        <Badge tone="accent" size="sm">
          {t.course.previewBadge}
        </Badge>
      )}

      {lesson.durationMinutes > 0 && (
        <span className="shrink-0 text-xs text-faint">
          {formatDurationShort(lesson.durationMinutes)}
        </span>
      )}

      {!lesson.isAccessible && (
        <>
          <Lock aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-faint" />
          <span className="sr-only">{t.course.lockedBadge}</span>
        </>
      )}
    </>
  );

  // Accessible lessons are links; locked ones are inert rows. Rendering a
  // locked lesson as a non-link means there is no address to share or guess
  // from the markup, and the lesson route checks access again server-side.
  if (!lesson.isAccessible) {
    return (
      <div className="flex cursor-not-allowed items-center gap-3 px-4 py-3 sm:px-5" aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/learn/${courseSlug}/${lesson.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface sm:px-5"
    >
      {body}
    </Link>
  );
}

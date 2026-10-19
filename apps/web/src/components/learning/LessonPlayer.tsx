'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, CircleCheck, Download, VideoOff } from 'lucide-react';
import type { LessonDetail } from '@nagis/shared-types';
import { formatDuration, t } from '@/i18n';
import { api } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { Badge, Card, StateBlock } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Field';
import { LessonNotes } from './LessonNotes';

interface CompleteResult {
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  courseCompleted: boolean;
  certificateCode: string | null;
}

/**
 * The lesson view: player area, content, resources and notes.
 *
 * Completion is persisted through the API, which recomputes course progress
 * and issues a certificate when the last lesson is done. The response drives
 * what the UI shows next, so the client never guesses whether the course is
 * finished.
 */
export function LessonPlayer({ lesson }: { lesson: LessonDetail }) {
  const router = useRouter();
  const [completed, setCompleted] = useState(lesson.progress?.status === 'COMPLETED');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState<CompleteResult | null>(null);

  async function toggleComplete() {
    setPending(true);
    setError('');
    try {
      if (completed) {
        await api.delete<unknown>(`/lessons/${lesson.id}/complete`);
        setCompleted(false);
        setFinished(null);
      } else {
        const result = await api.post<CompleteResult>(`/lessons/${lesson.id}/complete`);
        setCompleted(true);
        if (result.courseCompleted) setFinished(result);
      }
      // Refresh the server-rendered sidebar and progress bar.
      router.refresh();
    } catch (caught) {
      setError(
        isApiError(caught) ? caught.localisedMessage : t.errors.INTERNAL,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ---- Player area ---- */}
      <div className="overflow-hidden rounded-panel border border-hairline bg-ink-950">
        {lesson.video ? (
          // A real provider is configured and returned a playback descriptor.
          <div className="aspect-video w-full">
            {lesson.video.url ? (
              <video
                controls
                playsInline
                preload="metadata"
                className="h-full w-full bg-black"
                src={lesson.video.url}
              >
                {t.learn.video.error}
              </video>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <p className="text-sm text-ink-200">{t.learn.video.loading}</p>
              </div>
            )}
          </div>
        ) : lesson.type === 'VIDEO' ? (
          /*
            No video provider is configured (VIDEO_DRIVER=none). Say so
            plainly rather than showing a broken or fake player — the lesson
            text below is still fully available.
          */
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-pill bg-ink-800 text-ink-300"
            >
              <VideoOff className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-white">
              {t.learn.video.notConfiguredTitle}
            </p>
            <p className="max-w-md text-xs leading-relaxed text-ink-300">
              {t.learn.video.notConfiguredBody}
            </p>
          </div>
        ) : null}
      </div>

      {/* ---- Header ---- */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline" size="sm">
            {t.course.lessonType[lesson.type]}
          </Badge>
          {lesson.isPreview && (
            <Badge tone="accent" size="sm">
              {t.course.previewBadge}
            </Badge>
          )}
          {lesson.durationMinutes > 0 && (
            <span className="text-xs text-faint">
              {formatDuration(lesson.durationMinutes)}
            </span>
          )}
          {completed && (
            <Badge tone="success" size="sm">
              <Check aria-hidden="true" className="h-3 w-3" />
              {t.learn.completed}
            </Badge>
          )}
        </div>

        <h1 className="mt-3 text-display-sm">{lesson.title}</h1>
        <p className="mt-1.5 text-sm text-faint">{lesson.moduleTitle}</p>
      </div>

      <FormError message={error} />

      {/* ---- Course finished ---- */}
      {finished && (
        <Card
          className="border-[color-mix(in_srgb,var(--color-success)_35%,transparent)] bg-[var(--color-success-soft)] p-5"
          elevation="none"
        >
          <div className="flex items-start gap-3">
            <CircleCheck
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]"
            />
            <div>
              <p className="font-bold text-[var(--color-success)]">
                {t.learn.courseFinished.title}
              </p>
              <p className="mt-1 text-sm text-[var(--color-success)]/90">
                {t.learn.courseFinished.description}
              </p>
              {finished.certificateCode && (
                <Button
                  href={`/verify?code=${encodeURIComponent(finished.certificateCode)}`}
                  variant="primary"
                  size="sm"
                  className="mt-3"
                >
                  {t.learn.courseFinished.action}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ---- Description ---- */}
      {lesson.description && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-faint">
            {t.learn.descriptionTitle}
          </h2>
          <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-body">
            {lesson.description}
          </p>
        </section>
      )}

      {/* ---- Markdown-ish content ---- */}
      {lesson.content && <LessonContent content={lesson.content} />}

      {/* ---- Resources ---- */}
      {lesson.resources.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-faint">
            {t.learn.resourcesTitle}
          </h2>
          <ul className="mt-3 space-y-2">
            {lesson.resources.map((resource) => (
              <li key={resource.id}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-card border border-hairline bg-surface px-4 py-3 text-sm transition-colors hover:bg-surface-muted"
                >
                  <Download aria-hidden="true" className="h-4 w-4 shrink-0 text-accent-600" />
                  <span className="min-w-0 flex-1 truncate text-body">{resource.title}</span>
                  <span className="sr-only">{t.a11y.openInNewTab}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- Quiz ---- */}
      {lesson.quiz && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-faint">
            {t.learn.quiz.title}
          </h2>
          <StateBlock
            className="mt-3"
            title={lesson.quiz.title}
            description={lesson.quiz.description ?? undefined}
            action={
              <div className="text-center">
                <Button variant="primary" disabled>
                  {t.learn.quiz.start}
                </Button>
                <p className="mt-2.5 font-mono text-[11px] text-faint">
                  POST /api/v1/quizzes/{lesson.quiz.id}/attempts
                </p>
              </div>
            }
          />
        </section>
      )}

      {/* ---- Notes ---- */}
      <LessonNotes lessonId={lesson.id} initialNotes={lesson.progress?.notes ?? ''} />

      {/* ---- Completion + navigation ---- */}
      <div className="flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          onClick={() => void toggleComplete()}
          loading={pending}
          variant={completed ? 'secondary' : 'primary'}
          size="lg"
        >
          {completed ? (
            t.learn.markIncomplete
          ) : (
            <>
              <Check aria-hidden="true" className="h-4 w-4" />
              {pending ? t.learn.marking : t.learn.markComplete}
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button
            href={
              lesson.prevLessonId
                ? `/learn/${lesson.courseSlug}/${lesson.prevLessonId}`
                : `/courses/${lesson.courseSlug}`
            }
            variant="secondary"
            size="sm"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            {lesson.prevLessonId ? t.learn.previousLesson : t.learn.backToCourse}
          </Button>

          {lesson.nextLessonId && (
            <Button
              href={`/learn/${lesson.courseSlug}/${lesson.nextLessonId}`}
              variant="secondary"
              size="sm"
            >
              {t.learn.nextLesson}
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the lesson body.
 *
 * Seed content is Markdown, but no Markdown renderer is installed and
 * `dangerouslySetInnerHTML` on administrator-authored text would be an XSS
 * hole. So this does a deliberately small, safe transform: headings, list
 * items, fenced code and blockquotes are recognised as *React elements*, and
 * everything else renders as plain text. Nothing is ever injected as HTML.
 */
function LessonContent({ content }: { content: string }) {
  const blocks = content.split('\n\n');

  return (
    <section className="space-y-4">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Fenced code
        if (trimmed.startsWith('```')) {
          const body = trimmed.replace(/^```[a-z]*\n?/, '').replace(/```$/, '');
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-card border border-hairline bg-surface-muted p-4 text-xs leading-relaxed"
            >
              <code className="font-mono text-body">{body}</code>
            </pre>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={index} className="pt-1 text-sm font-bold text-heading">
              {trimmed.slice(4)}
            </h4>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={index} className="pt-2 text-lg font-bold text-heading">
              {trimmed.slice(3)}
            </h3>
          );
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={index}
              className="border-l-2 border-accent-400 bg-surface-muted/60 py-2 pl-4 text-sm italic leading-relaxed text-muted"
            >
              {trimmed.replace(/^> /gm, '')}
            </blockquote>
          );
        }

        // Bullet or numbered list
        const lines = trimmed.split('\n');
        if (lines.every((line) => /^\s*[-*]\s/.test(line))) {
          return (
            <ul key={index} className="list-disc space-y-1.5 pl-5 text-[0.9375rem] text-body">
              {lines.map((line, i) => (
                <li key={i}>{line.replace(/^\s*[-*]\s/, '')}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((line) => /^\s*\d+\.\s/.test(line))) {
          return (
            <ol key={index} className="list-decimal space-y-1.5 pl-5 text-[0.9375rem] text-body">
              {lines.map((line, i) => (
                <li key={i}>{line.replace(/^\s*\d+\.\s/, '')}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={index} className="text-[0.9375rem] leading-relaxed text-body">
            {trimmed}
          </p>
        );
      })}
    </section>
  );
}

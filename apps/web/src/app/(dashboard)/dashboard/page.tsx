import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  PlayCircle,
  ServerCrash,
} from 'lucide-react';
import type { DashboardSummary } from '@nagis/shared-types';
import { formatDate, formatDuration, t } from '@/i18n';
import { getDashboard } from '@/lib/api/server';
import { settle } from '@/lib/api/safe';
import { Badge, Card, Progress, StateBlock } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';

export const metadata: Metadata = { title: t.meta.dashboardTitle };

/**
 * Student dashboard.
 *
 * Every figure comes from `GET /me/dashboard`, which computes it from real
 * LessonProgress, Enrollment and Certificate rows. Nothing here is sample
 * data, so a brand-new account correctly shows zeroes and empty states rather
 * than a fake populated dashboard.
 */
export default async function DashboardPage() {
  const result = await settle(getDashboard);

  if (!result.ok) {
    return (
      <StateBlock
        tone="danger"
        icon={<ServerCrash className="h-5 w-5" />}
        title={t.errorPage.title}
        description={result.error}
        action={
          <Button href="/dashboard" variant="secondary">
            {t.common.retry}
          </Button>
        }
      />
    );
  }

  const summary = result.data;
  const firstName = summary.user.fullName.split(' ')[0] ?? summary.user.fullName;

  return (
    <div className="space-y-8">
      {/* ---- Welcome ---- */}
      <header>
        <h1 className="text-display-sm sm:text-display-md">
          {t.dashboard.greeting(firstName)}
        </h1>
        <p className="mt-2 text-base text-muted">{t.dashboard.subtitle}</p>
      </header>

      {/* ---- Stats ---- */}
      <StatGrid stats={summary.stats} />

      {/* ---- Continue learning ---- */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-display-sm">{t.dashboard.continueTitle}</h2>
          {summary.continueLearning.length > 0 && (
            <Button href="/dashboard/courses" variant="ghost" size="sm">
              {t.common.viewAll}
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {summary.continueLearning.length === 0 ? (
          <StateBlock
            icon={<BookOpen className="h-5 w-5" />}
            title={t.dashboard.continueEmpty.title}
            description={t.dashboard.continueEmpty.description}
            action={
              <Button href="/courses" variant="primary">
                {t.dashboard.continueEmpty.action}
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summary.continueLearning.map((enrollment, index) => (
              <Reveal as="li" key={enrollment.id} delay={stagger(index, 0.06)}>
                <ContinueCard enrollment={enrollment} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Charts ---- */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-heading">{t.dashboard.activityTitle}</h2>
            <p className="text-xs text-faint">{t.dashboard.activitySubtitle}</p>
          </div>
          <ActivityChart data={summary.activity} />
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-heading">{t.dashboard.breakdownTitle}</h2>
            <p className="text-xs text-faint">{t.dashboard.activitySubtitle}</p>
          </div>
          <CategoryDonut data={summary.categoryBreakdown} />
        </Card>
      </div>

      {/* ---- Recent activity ---- */}
      <section>
        <h2 className="mb-4 text-display-sm">{t.dashboard.recentTitle}</h2>
        {summary.recentActivity.length === 0 ? (
          <StateBlock title={t.dashboard.recentEmpty} />
        ) : (
          <Card className="divide-y divide-[var(--surface-hairline)] overflow-hidden" elevation="subtle">
            <ul>
              {summary.recentActivity.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/courses/${event.courseSlug}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-muted"
                  >
                    <EventIcon type={event.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-heading">
                        {event.title}
                      </span>
                      <span className="block truncate text-xs text-faint">
                        {t.dashboard.recent[event.type]} · {event.courseTitle}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-faint">{formatDate(event.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function StatGrid({ stats }: { stats: DashboardSummary['stats'] }) {
  const items = [
    {
      icon: BookOpen,
      label: t.dashboard.stats.activeCourses,
      value: String(stats.activeCourses),
      accent: 'var(--color-accent-600)',
    },
    {
      icon: CheckCircle2,
      label: t.dashboard.stats.completedCourses,
      value: String(stats.completedCourses),
      accent: 'var(--color-success)',
    },
    {
      icon: PlayCircle,
      label: t.dashboard.stats.completedLessons,
      value: `${stats.completedLessons}${stats.totalLessons > 0 ? ` / ${stats.totalLessons}` : ''}`,
      accent: 'var(--color-violet-accent)',
    },
    {
      icon: Clock,
      label: t.dashboard.stats.learnedTime,
      value: formatDuration(stats.learnedMinutes),
      accent: 'var(--color-teal-accent)',
    },
    {
      icon: Award,
      label: t.dashboard.stats.certificates,
      value: String(stats.certificates),
      accent: '#d97706',
    },
    {
      icon: Flame,
      label: t.dashboard.stats.streak,
      value: t.dashboard.stats.streakDays(stats.streakDays),
      accent: '#e11d48',
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((item, index) => (
        <Reveal key={item.label} delay={stagger(index, 0.04)}>
          <Card className="p-4" elevation="subtle">
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[0.5rem]"
              style={{
                backgroundColor: `color-mix(in srgb, ${item.accent} 12%, transparent)`,
                color: item.accent,
              }}
            >
              <item.icon className="h-4 w-4" />
            </span>
            <dd className="mt-3 text-xl font-extrabold tracking-tight text-heading">
              {item.value}
            </dd>
            <dt className="mt-0.5 text-xs leading-snug text-faint">{item.label}</dt>
          </Card>
        </Reveal>
      ))}
    </dl>
  );
}

function ContinueCard({
  enrollment,
}: {
  enrollment: DashboardSummary['continueLearning'][number];
}) {
  const target = enrollment.nextLesson
    ? `/learn/${enrollment.course.slug}/${enrollment.nextLesson.id}`
    : `/courses/${enrollment.course.slug}`;

  return (
    <Card interactive className="group flex h-full flex-col p-5">
      <Link href={target} className="flex flex-1 flex-col focus-visible:outline-none">
        <Badge tone="outline" size="sm" className="w-fit">
          {enrollment.course.category.name}
        </Badge>

        <h3 className="mt-3 line-clamp-2 text-[0.9375rem] font-bold leading-snug text-heading transition-colors group-hover:text-accent-600">
          {enrollment.course.title}
        </h3>

        {enrollment.nextLesson && (
          <p className="mt-2 line-clamp-1 text-xs text-faint">
            {t.dashboard.nextLesson}: {enrollment.nextLesson.title}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-muted">
              {t.dashboard.progressLabel(enrollment.progressPercent)}
            </span>
            <span className="text-faint">
              {t.dashboard.lessonsOf(enrollment.completedLessons, enrollment.totalLessons)}
            </span>
          </div>
          <Progress value={enrollment.progressPercent} size="sm" />
        </div>
      </Link>
    </Card>
  );
}

function EventIcon({ type }: { type: DashboardSummary['recentActivity'][number]['type'] }) {
  const map = {
    LESSON_COMPLETED: { icon: CheckCircle2, colour: 'var(--color-success)' },
    COURSE_ENROLLED: { icon: BookOpen, colour: 'var(--color-accent-600)' },
    CERTIFICATE_ISSUED: { icon: Award, colour: '#d97706' },
    QUIZ_PASSED: { icon: GraduationCap, colour: 'var(--color-violet-accent)' },
  } as const;

  const { icon: Icon, colour } = map[type];

  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill"
      style={{
        backgroundColor: `color-mix(in srgb, ${colour} 12%, transparent)`,
        color: colour,
      }}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

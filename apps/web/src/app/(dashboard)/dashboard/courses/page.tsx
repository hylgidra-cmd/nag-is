import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Bookmark, ServerCrash } from 'lucide-react';
import type { EnrollmentDto } from '@nagis/shared-types';
import { formatDate, t } from '@/i18n';
import { getMyCourses, getSavedCourses } from '@/lib/api/server';
import { settle } from '@/lib/api/safe';
import { cn } from '@/lib/cn';
import { Badge, Card, Progress, StateBlock } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { CourseCard } from '@/components/courses/CourseCard';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';

export const metadata: Metadata = { title: t.dashboard.myCourses.title };
export const dynamic = 'force-dynamic';

type Tab = 'all' | 'active' | 'completed' | 'saved';

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: t.dashboard.myCourses.tabs.all },
  { value: 'active', label: t.dashboard.myCourses.tabs.active },
  { value: 'completed', label: t.dashboard.myCourses.tabs.completed },
  { value: 'saved', label: t.dashboard.myCourses.tabs.saved },
];

/**
 * The student's enrolled and saved courses.
 *
 * The active tab lives in the URL (`?tab=`), so a tab is linkable and the
 * browser back button works. Each tab issues only the request it needs.
 */
export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab: Tab = isTab(rawTab) ? rawTab : 'all';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display-sm sm:text-display-md">{t.dashboard.myCourses.title}</h1>
        <p className="mt-2 text-base text-muted">{t.dashboard.myCourses.subtitle}</p>
      </header>

      {/* ---- Tabs: real links, not client state ---- */}
      <nav aria-label={t.dashboard.myCourses.title}>
        <ul className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-hairline pb-0">
          {TABS.map((item) => {
            const active = item.value === tab;
            return (
              <li key={item.value} className="shrink-0">
                <Link
                  href={item.value === 'all' ? '/dashboard/courses' : `/dashboard/courses?tab=${item.value}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    '-mb-px block whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-accent-600 text-accent-600 dark:text-accent-300'
                      : 'border-transparent text-muted hover:border-ink-300 hover:text-heading',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {tab === 'saved' ? <SavedList /> : <EnrolledList tab={tab} />}
    </div>
  );
}

async function EnrolledList({ tab }: { tab: Exclude<Tab, 'saved'> }) {
  const status = tab === 'active' ? 'ACTIVE' : tab === 'completed' ? 'COMPLETED' : undefined;
  const result = await settle(() => getMyCourses({ status, perPage: 24 }));

  if (!result.ok) {
    return (
      <StateBlock
        tone="danger"
        icon={<ServerCrash className="h-5 w-5" />}
        title={t.errorPage.title}
        description={result.error}
      />
    );
  }

  if (result.data.items.length === 0) {
    return (
      <StateBlock
        icon={<BookOpen className="h-5 w-5" />}
        title={t.dashboard.myCourses.empty.title}
        description={t.dashboard.myCourses.empty.description}
        action={
          <Button href="/courses" variant="primary">
            {t.dashboard.myCourses.empty.action}
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {result.data.items.map((enrollment, index) => (
        <Reveal as="li" key={enrollment.id} delay={stagger(index, 0.04)}>
          <EnrolledCard enrollment={enrollment} />
        </Reveal>
      ))}
    </ul>
  );
}

async function SavedList() {
  const result = await settle(getSavedCourses);

  if (!result.ok) {
    return (
      <StateBlock
        tone="danger"
        icon={<ServerCrash className="h-5 w-5" />}
        title={t.errorPage.title}
        description={result.error}
      />
    );
  }

  if (result.data.length === 0) {
    return (
      <StateBlock
        icon={<Bookmark className="h-5 w-5" />}
        title={t.dashboard.myCourses.savedEmpty.title}
        description={t.dashboard.myCourses.savedEmpty.description}
        action={
          <Button href="/courses" variant="primary">
            {t.dashboard.myCourses.savedEmpty.action}
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {result.data.map((course, index) => (
        <Reveal as="li" key={course.id} delay={stagger(index, 0.04)}>
          <CourseCard course={course} className="h-full" />
        </Reveal>
      ))}
    </ul>
  );
}

function EnrolledCard({ enrollment }: { enrollment: EnrollmentDto }) {
  const completed = enrollment.status === 'COMPLETED';
  const target = enrollment.nextLesson
    ? `/learn/${enrollment.course.slug}/${enrollment.nextLesson.id}`
    : `/courses/${enrollment.course.slug}`;

  return (
    <Card interactive className="group flex h-full flex-col p-5">
      <Link href={target} className="flex flex-1 flex-col focus-visible:outline-none">
        <div className="flex items-start justify-between gap-2">
          <Badge tone="outline" size="sm">
            {enrollment.course.category.name}
          </Badge>
          {completed && <Badge tone="success" size="sm">{t.course.completed}</Badge>}
        </div>

        <h3 className="mt-3 line-clamp-2 text-[0.9375rem] font-bold leading-snug text-heading transition-colors group-hover:text-accent-600">
          {enrollment.course.title}
        </h3>

        <p className="mt-1.5 text-xs text-faint">{enrollment.course.instructor.fullName}</p>

        <div className="mt-auto pt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-muted">
              {t.dashboard.progressLabel(enrollment.progressPercent)}
            </span>
            <span className="text-faint">
              {t.dashboard.lessonsOf(enrollment.completedLessons, enrollment.totalLessons)}
            </span>
          </div>
          <Progress
            value={enrollment.progressPercent}
            size="sm"
            tone={completed ? 'success' : 'accent'}
          />
          <p className="mt-2.5 text-xs text-faint">
            {completed && enrollment.completedAt
              ? `${t.dashboard.myCourses.completedAt}: ${formatDate(enrollment.completedAt)}`
              : `${t.dashboard.myCourses.enrolledAt}: ${formatDate(enrollment.enrolledAt)}`}
          </p>
        </div>
      </Link>
    </Card>
  );
}

function isTab(value: string | undefined): value is Tab {
  return value === 'all' || value === 'active' || value === 'completed' || value === 'saved';
}

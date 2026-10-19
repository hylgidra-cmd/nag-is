import type { InstructorSummary } from '@nagis/shared-types';
import { t } from '@/i18n';
import { Card, SectionHeading, StateBlock } from '@/components/ui/primitives';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';

type InstructorWithCount = InstructorSummary & { courseCount: number };

/**
 * Instructor introductions.
 *
 * Only instructors the API actually returns — meaning real accounts that have
 * at least one published course. No invented faculty, and no stock portraits:
 * avatar uploads do not exist yet, so an initials monogram is used.
 */
export function Instructors({ instructors }: { instructors: InstructorWithCount[] }) {
  return (
    <section id="instructors" className="container-page py-16 sm:py-20">
      <Reveal>
        <SectionHeading
          eyebrow={t.sections.instructors.title}
          title={t.sections.instructors.title}
          description={t.sections.instructors.subtitle}
          align="center"
        />
      </Reveal>

      {instructors.length === 0 ? (
        <StateBlock className="mt-10" title={t.sections.instructors.empty} />
      ) : (
        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {instructors.map((instructor, index) => (
            <Reveal as="li" key={instructor.id} delay={stagger(index, 0.06)}>
              <Card className="flex h-full flex-col items-center p-6 text-center" elevation="none">
                <Monogram name={instructor.fullName} />
                <h3 className="mt-4 text-base font-bold text-heading">{instructor.fullName}</h3>
                {instructor.headline && (
                  <p className="mt-1 text-xs font-medium text-accent-600 dark:text-accent-300">
                    {instructor.headline}
                  </p>
                )}
                {instructor.bio && (
                  <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-muted">
                    {instructor.bio}
                  </p>
                )}
                <p className="mt-4 text-xs text-faint">
                  {t.sections.instructors.courseCount(instructor.courseCount)}
                </p>
              </Card>
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}

function Monogram({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      aria-hidden="true"
      className="flex h-16 w-16 items-center justify-center rounded-pill bg-gradient-to-br from-accent-500 to-violet-accent text-xl font-extrabold text-white shadow-subtle"
    >
      {initials || '?'}
    </span>
  );
}

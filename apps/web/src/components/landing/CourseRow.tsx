import { ArrowRight } from 'lucide-react';
import type { CourseListItem } from '@nagis/shared-types';
import { t } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/primitives';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';
import { CourseCard } from '@/components/courses/CourseCard';

interface CourseRowProps {
  eyebrow?: string;
  title: string;
  description?: string;
  courses: CourseListItem[];
  /** Catalog link for the "see all" action. */
  viewAllHref: string;
  /** Tints the section background, to separate adjacent rows. */
  muted?: boolean;
  priority?: boolean;
}

/**
 * A titled row of course cards.
 *
 * Renders nothing when the list is empty: on a marketing page an empty
 * "Biypul kurslar" heading with a placeholder underneath is worse than the
 * section simply not being there.
 */
export function CourseRow({
  eyebrow,
  title,
  description,
  courses,
  viewAllHref,
  muted = false,
  priority = false,
}: CourseRowProps) {
  if (courses.length === 0) return null;

  return (
    <section className={muted ? 'border-y border-hairline bg-surface-muted/45' : undefined}>
      <div className="container-page py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
            action={
              <Button href={viewAllHref} variant="secondary" size="sm">
                {t.common.viewAll}
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Button>
            }
          />
        </Reveal>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.slice(0, 6).map((course, index) => (
            <Reveal as="li" key={course.id} delay={stagger(index, 0.05)}>
              <CourseCard course={course} priority={priority && index < 3} className="h-full" />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { CategoryDto } from '@nagis/shared-types';
import { t } from '@/i18n';
import { Card, SectionHeading, StateBlock } from '@/components/ui/primitives';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';
import { CategoryIcon } from '@/components/courses/CategoryIcon';

/** The twelve launch tracks, read from the database. */
export function CategoryGrid({ categories }: { categories: CategoryDto[] }) {
  return (
    <section className="container-page py-16 sm:py-20">
      <Reveal>
        <SectionHeading
          eyebrow={t.nav.categories}
          title={t.categories.title}
          description={t.categories.subtitle}
        />
      </Reveal>

      {categories.length === 0 ? (
        <StateBlock className="mt-10" title={t.categories.empty} />
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category, index) => (
            <Reveal as="li" key={category.id} delay={stagger(index, 0.04)}>
              <Card
                interactive
                className="group h-full"
                // The accent tints the hover border without a per-category class.
                style={
                  {
                    '--cat-accent': category.accent ?? 'var(--color-accent-600)',
                  } as React.CSSProperties
                }
              >
                <Link
                  href={`/courses?category=${encodeURIComponent(category.slug)}`}
                  className="flex h-full flex-col p-5 focus-visible:outline-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <CategoryIcon
                      name={category.icon}
                      accent={category.accent}
                      className="h-11 w-11 shrink-0 transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-600 motion-reduce:transition-none"
                    />
                  </div>

                  <h3 className="mt-4 text-[0.9375rem] font-bold leading-snug text-heading">
                    {category.name}
                  </h3>

                  {category.description && (
                    <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-muted">
                      {category.description}
                    </p>
                  )}

                  <p className="mt-4 text-xs font-medium text-faint">
                    {t.categories.courseCount(category.courseCount)}
                  </p>
                </Link>
              </Card>
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}

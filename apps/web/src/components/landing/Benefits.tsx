import {
  Award,
  Clock4,
  Languages,
  RefreshCw,
  Smartphone,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { t } from '@/i18n';
import { Card, SectionHeading } from '@/components/ui/primitives';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';

/**
 * Icons pair positionally with `t.sections.benefits.items`, so the copy stays
 * in the dictionary and only the iconography lives here.
 */
const ICONS: LucideIcon[] = [Languages, Wrench, Clock4, Award, Smartphone, RefreshCw];

export function Benefits() {
  const items = t.sections.benefits.items;

  return (
    <section className="border-y border-hairline bg-surface-muted/45">
      <div className="container-page py-16 sm:py-20">
        <Reveal>
          <SectionHeading
            eyebrow={t.sections.benefits.title}
            title={t.sections.benefits.title}
            description={t.sections.benefits.subtitle}
            align="center"
          />
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const Icon = ICONS[index] ?? Award;
            return (
              <Reveal as="li" key={item.title} delay={stagger(index, 0.05)}>
                <Card className="h-full p-6" elevation="none">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[0.75rem] bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100 dark:bg-accent-900/35 dark:text-accent-200 dark:ring-accent-800"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-heading">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                </Card>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

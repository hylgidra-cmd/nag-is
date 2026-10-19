'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { SectionHeading } from '@/components/ui/primitives';
import { Reveal } from '@/components/motion/Reveal';

/**
 * FAQ accordion.
 *
 * Implemented with buttons plus `aria-expanded`/`aria-controls` rather than
 * `<details>`, because the height transition needs to be animated and
 * `<details>` cannot be animated reliably across browsers. Keyboard behaviour
 * is native: each header is a real button in tab order, toggled with
 * Enter/Space.
 *
 * Several panels may be open at once — these are independent questions, so
 * closing one to read another would be annoying.
 */
export function Faq() {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const reduceMotion = useReducedMotion();

  function toggle(index: number) {
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <section id="faq" className="container-page py-16 sm:py-20">
      <Reveal>
        <SectionHeading
          eyebrow={t.sections.faq.title}
          title={t.sections.faq.title}
          description={t.sections.faq.subtitle}
          align="center"
        />
      </Reveal>

      <div className="mx-auto mt-12 max-w-3xl divide-y divide-[var(--surface-hairline)] overflow-hidden rounded-panel border border-hairline bg-surface">
        {t.sections.faq.items.map((item, index) => {
          const expanded = open.has(index);
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;

          return (
            <div key={item.question}>
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4.5 text-left transition-colors hover:bg-surface-muted sm:px-6"
                >
                  <span
                    className={cn(
                      'text-[0.9375rem] font-semibold leading-snug transition-colors',
                      expanded ? 'text-accent-600 dark:text-accent-300' : 'text-heading',
                    )}
                  >
                    {item.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-hairline transition-all duration-300',
                      expanded
                        ? 'rotate-45 border-accent-300 bg-accent-50 text-accent-600 dark:bg-accent-900/40'
                        : 'text-faint',
                      'motion-reduce:transition-none',
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={reduceMotion ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduceMotion ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                    }
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

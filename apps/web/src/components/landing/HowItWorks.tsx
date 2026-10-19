import { t } from '@/i18n';
import { SectionHeading } from '@/components/ui/primitives';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';

/** Four-step explanation of the platform flow. */
export function HowItWorks() {
  const steps = t.sections.howItWorks.steps;

  return (
    <section className="container-page py-16 sm:py-20">
      <Reveal>
        <SectionHeading
          eyebrow={t.sections.howItWorks.title}
          title={t.sections.howItWorks.title}
          description={t.sections.howItWorks.subtitle}
          align="center"
        />
      </Reveal>

      <ol className="relative mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {/* Connecting line across the four steps at desktop width. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px lg:block"
          style={{
            backgroundImage:
              'linear-gradient(to right, transparent, var(--surface-hairline) 12%, var(--surface-hairline) 88%, transparent)',
          }}
        />

        {steps.map((step, index) => (
          <Reveal as="li" key={step.title} delay={stagger(index, 0.08)} className="relative">
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-pill border border-hairline bg-surface text-base font-extrabold text-accent-600 shadow-subtle">
              {index + 1}
            </div>
            <h3 className="mt-5 text-base font-bold text-heading">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

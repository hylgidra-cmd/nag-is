import { ArrowRight } from 'lucide-react';
import { t } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/motion/Reveal';

/** Closing call to action, on the brand navy. */
export function CtaBanner() {
  return (
    <section className="container-page py-16 sm:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-panel bg-ink-900 px-6 py-14 sm:px-12 sm:py-16">
          {/* Decorative: a soft accent wash plus the hairline grid. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 70% 100% at 85% 0%, #2f66f6 0%, transparent 60%), radial-gradient(ellipse 60% 100% at 10% 100%, #7c5cf0 0%, transparent 55%)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-display-sm text-white sm:text-display-md">
              {t.sections.cta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-200">
              {t.sections.cta.subtitle}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/register" size="lg" variant="inverted">
                {t.sections.cta.primary}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Button>
              <Button
                href="/courses"
                size="lg"
                variant="ghost"
                className="border border-ink-600 text-white hover:bg-ink-800"
              >
                {t.sections.cta.secondary}
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

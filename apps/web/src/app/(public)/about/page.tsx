import type { Metadata } from 'next';
import { Compass, Languages, Mail, MapPin, ShieldCheck, Wrench } from 'lucide-react';
import { t } from '@/i18n';
import { getInstructors } from '@/lib/api/server';
import { safely } from '@/lib/api/safe';
import { Card, SectionHeading } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Instructors } from '@/components/landing/Instructors';
import { Faq } from '@/components/landing/Faq';
import { Reveal } from '@/components/motion/Reveal';
import { stagger } from '@/lib/stagger';

export const metadata: Metadata = {
  title: t.meta.aboutTitle,
  description: t.about.lead,
};

/** Icons pair positionally with `t.about.approach`. */
const APPROACH_ICONS = [Languages, Wrench, ShieldCheck];

/**
 * About page.
 *
 * The footer and navbar both link here, and `#instructors`, `#faq` and
 * `#contact` are deep-linked from the footer — so all three anchors exist on
 * this page.
 *
 * The "current status" section states plainly which parts of the platform are
 * finished and which are not, rather than implying everything works.
 */
export default async function AboutPage() {
  const instructors = await safely(getInstructors, [], 'instructors');

  return (
    <>
      {/* ---- Lead ---- */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid opacity-50 mask-fade-radial dark:opacity-20"
        />
        <div className="container-page relative py-16 sm:py-20">
          <div className="max-w-3xl">
            <h1 className="text-display-md sm:text-display-lg">{t.about.title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{t.about.lead}</p>
          </div>
        </div>
      </section>

      {/* ---- Mission ---- */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          <div>
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 items-center justify-center rounded-[0.75rem] bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100 dark:bg-accent-900/35 dark:text-accent-200 dark:ring-accent-800"
            >
              <Compass className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-display-sm">{t.about.missionTitle}</h2>
          </div>
          <p className="text-base leading-relaxed text-body">{t.about.mission}</p>
        </div>
      </section>

      {/* ---- Approach ---- */}
      <section className="border-y border-hairline bg-surface-muted/45">
        <div className="container-page py-16 sm:py-20">
          <Reveal>
            <SectionHeading title={t.about.approachTitle} align="center" />
          </Reveal>

          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {t.about.approach.map((item, index) => {
              const Icon = APPROACH_ICONS[index] ?? Compass;
              return (
                <Reveal as="li" key={item.title} delay={stagger(index, 0.06)}>
                  <Card className="h-full p-6" elevation="none">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-[0.75rem] bg-surface text-accent-600 shadow-subtle"
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

      {/* ---- Instructors (anchor target from the footer) ---- */}
      <Instructors instructors={instructors} />

      {/* ---- Current status: honest about what is and is not finished ---- */}
      <section className="container-page pb-4">
        <Reveal>
          <Card className="p-6 sm:p-8" tone="muted" elevation="none">
            <h2 className="text-display-sm">{t.about.statusTitle}</h2>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">
              {t.about.statusBody}
            </p>
          </Card>
        </Reveal>
      </section>

      {/* ---- FAQ (anchor target) ---- */}
      <Faq />

      {/* ---- Contact (anchor target) ---- */}
      <section id="contact" className="container-page pb-20">
        <Reveal>
          <Card className="p-6 sm:p-8">
            <h2 className="text-display-sm">{t.about.contactTitle}</h2>
            <p className="mt-3 text-base text-muted">{t.about.contactBody}</p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button href="mailto:salem@nagis.uz" variant="primary">
                <Mail aria-hidden="true" className="h-4 w-4" />
                salem@nagis.uz
              </Button>
              <p className="flex items-center gap-2.5 text-sm text-muted">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-faint" />
                {t.footer.location}
              </p>
            </div>
          </Card>
        </Reveal>
      </section>
    </>
  );
}

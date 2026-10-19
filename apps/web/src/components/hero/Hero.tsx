import { ArrowRight, BookOpen, GraduationCap, Layers, PlayCircle } from 'lucide-react';
import { t } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/primitives';
import { Reveal } from '@/components/motion/Reveal';
import { HeroVisual } from './HeroVisual';

interface HeroProps {
  /**
   * Real counts from the database. Rendered only when present — the hero
   * never shows an invented learner count or a fabricated statistic.
   */
  stats: {
    courses: number;
    categories: number;
    lessons: number;
    hours: number;
  } | null;
}

export function Hero({ stats }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Hairline grid, faded out radially so it never competes with text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid opacity-[0.55] mask-fade-radial dark:opacity-25"
      />

      <div className="container-page relative py-16 sm:py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          {/* ---- Copy ---- */}
          <div>
            <Reveal>
              <Badge tone="accent" size="lg" className="mb-6">
                <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />
                {t.hero.badge}
              </Badge>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="text-display-lg sm:text-display-xl lg:text-display-2xl">
                IT kásibin{' '}
                <span className="text-gradient-brand">{t.hero.titleAccent}</span> úyreniń
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                {t.hero.subtitle}
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href="/courses" size="lg" variant="ink">
                  {t.hero.primaryCta}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>
                <Button href="/register" size="lg" variant="secondary">
                  <PlayCircle aria-hidden="true" className="h-4 w-4" />
                  {t.hero.secondaryCta}
                </Button>
              </div>
            </Reveal>

            {/* Real platform counts, or nothing at all. */}
            {stats && (
              <Reveal delay={0.24}>
                <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                  <Stat icon={BookOpen} value={stats.courses} label={t.hero.stats.courses} />
                  <Stat icon={Layers} value={stats.categories} label={t.hero.stats.categories} />
                  <Stat icon={PlayCircle} value={stats.lessons} label={t.hero.stats.lessons} />
                  <Stat
                    icon={GraduationCap}
                    value={stats.hours}
                    label={t.hero.stats.hours}
                  />
                </dl>
              </Reveal>
            )}
          </div>

          {/* ---- Visual ---- */}
          <Reveal delay={0.1} className="relative">
            <HeroVisual />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BookOpen;
  value: number;
  label: string;
}) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="flex items-baseline gap-1.5">
          <Icon aria-hidden="true" className="h-4 w-4 translate-y-px text-accent-600" />
          <span className="text-2xl font-extrabold tracking-tight text-heading">{value}</span>
        </span>
        <span className="mt-0.5 block text-xs text-faint">{label}</span>
      </dd>
    </div>
  );
}

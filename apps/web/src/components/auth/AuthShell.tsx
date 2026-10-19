import Link from 'next/link';
import { t } from '@/i18n';
import { Logo } from '@/components/brand/Logo';

/**
 * Shared frame for the authentication screens.
 *
 * Two columns on desktop: the form on the left, a brand panel on the right
 * carrying the product promise. The right panel is purely decorative and is
 * hidden below `lg`, so a phone shows only the form.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1fr]">
      {/* ---- Form column ---- */}
      <div className="flex flex-col px-5 py-8 sm:px-8 lg:px-12">
        <Link href="/" className="inline-flex w-fit rounded-md transition-opacity hover:opacity-85">
          <Logo size="md" />
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-display-sm">{title}</h1>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
          </div>
        </div>

        <p className="text-xs text-faint">{t.footer.rights(new Date().getFullYear())}</p>
      </div>

      {/* ---- Brand column ---- */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-ink-900 lg:block"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 90% at 80% 10%, #2f66f6 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 15% 90%, #7c5cf0 0%, transparent 55%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="relative flex h-full flex-col justify-center px-12 xl:px-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-300">
            {t.hero.badge}
          </p>
          <p className="mt-5 max-w-md font-display text-3xl font-extrabold leading-tight tracking-[-0.025em] text-white xl:text-4xl">
            {t.brand.tagline}
          </p>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-200">
            {t.footer.about}
          </p>

          <ul className="mt-10 space-y-3.5">
            {t.sections.benefits.items.slice(0, 3).map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-accent-500/25">
                  <svg viewBox="0 0 20 20" className="h-3 w-3 fill-accent-300">
                    <path d="M7.6 14.2L3.4 10l1.4-1.4 2.8 2.8 7-7L16 5.8z" />
                  </svg>
                </span>
                <span className="text-sm text-ink-100">{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

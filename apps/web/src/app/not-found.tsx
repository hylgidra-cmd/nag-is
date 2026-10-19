import Link from 'next/link';
import { t, localeMeta } from '@/i18n';

/**
 * Root 404.
 *
 * Lives outside the (public) group, so it renders its own minimal chrome
 * rather than inheriting a layout that would need an API call to build.
 */
export default function NotFound() {
  return (
    <html lang={localeMeta.kaa.htmlLang}>
      <body className="min-h-dvh bg-canvas">
        <main className="container-page flex min-h-dvh flex-col items-center justify-center py-20 text-center">
          <p className="font-display text-7xl font-extrabold tracking-tight text-accent-600">
            {t.notFound.code}
          </p>
          <h1 className="mt-5 text-display-sm">{t.notFound.title}</h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
            {t.notFound.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-pill bg-ink-900 px-6 text-sm font-medium text-white transition-colors hover:bg-ink-800"
            >
              {t.notFound.home}
            </Link>
            <Link
              href="/courses"
              className="inline-flex h-11 items-center justify-center rounded-pill border border-hairline bg-surface px-6 text-sm font-medium text-heading transition-colors hover:bg-surface-muted"
            >
              {t.notFound.courses}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}

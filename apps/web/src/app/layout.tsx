import type { Metadata, Viewport } from 'next';
import { localeMeta, t } from '@/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: t.meta.homeTitle,
    template: `%s · NAG${'ʼ'}IS`,
  },
  description: t.meta.homeDescription,
  applicationName: "NAGʼIS",
  keywords: [
    'IT kurslar',
    'programmalastırıw',
    'IT tálim',
    'frontend',
    'backend',
    'Python',
    'onlayn kurs',
  ],
  authors: [{ name: "NAGʼIS" }],
  openGraph: {
    type: 'website',
    siteName: "NAGʼIS",
    title: t.meta.homeTitle,
    description: t.meta.homeDescription,
    locale: 'kaa_Latn',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfcfe' },
    { media: '(prefers-color-scheme: dark)', color: '#080f1a' },
  ],
};

/**
 * Applies the stored theme before first paint.
 *
 * Without this the page renders in the OS theme and then snaps to the stored
 * preference, which is a visible flash. It runs synchronously in <head>, and
 * every access is guarded because storage throws in private mode and in
 * thumbnail capture.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('nagis-theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={localeMeta.kaa.htmlLang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/*
          Inter is loaded as a progressive enhancement. The font stack in
          globals.css falls back to the system UI font, so a blocked or slow
          Google Fonts request costs nothing but the nicer typeface — the page
          still renders immediately with correct metrics.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-canvas text-body antialiased">
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-pill bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-lifted"
        >
          {t.nav.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}

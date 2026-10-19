'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, BookOpen, LayoutDashboard, Settings, Shield } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useSession } from '@/components/auth/SessionProvider';

const LINKS = [
  { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, exact: true },
  { href: '/dashboard/courses', label: t.nav.myCourses, icon: BookOpen, exact: false },
  { href: '/dashboard/certificates', label: t.nav.certificates, icon: Award, exact: false },
  { href: '/dashboard/settings', label: t.nav.settings, icon: Settings, exact: false },
] as const;

/**
 * Dashboard navigation.
 *
 * A horizontal scroller on mobile, a vertical rail from `lg`. The admin link
 * is shown only to administrators — presentation only; the /admin routes are
 * guarded server-side regardless.
 */
export function DashboardNav() {
  const pathname = usePathname();
  const { isAdmin } = useSession();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav aria-label={t.nav.dashboard}>
      <ul className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {LINKS.map((link) => {
          const active = isActive(link.href, link.exact);
          return (
            <li key={link.href} className="shrink-0 lg:shrink">
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 whitespace-nowrap rounded-card px-3.5 py-2.5 text-sm font-medium transition-colors lg:w-full',
                  active
                    ? 'bg-ink-900 text-white dark:bg-accent-600'
                    : 'text-body hover:bg-surface-muted hover:text-heading',
                )}
              >
                <link.icon
                  aria-hidden="true"
                  className={cn('h-4 w-4 shrink-0', !active && 'text-faint')}
                />
                {link.label}
              </Link>
            </li>
          );
        })}

        {isAdmin && (
          <li className="shrink-0 lg:mt-2 lg:shrink lg:border-t lg:border-hairline lg:pt-2">
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-2.5 whitespace-nowrap rounded-card px-3.5 py-2.5 text-sm font-medium transition-colors lg:w-full',
                pathname.startsWith('/admin')
                  ? 'bg-ink-900 text-white dark:bg-accent-600'
                  : 'text-body hover:bg-surface-muted hover:text-heading',
              )}
            >
              <Shield aria-hidden="true" className="h-4 w-4 shrink-0 text-faint" />
              {t.nav.admin}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

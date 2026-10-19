'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, BookOpen, LayoutDashboard, Layers, Receipt, Users } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/admin', label: t.admin.nav.overview, icon: LayoutDashboard, exact: true },
  { href: '/admin/courses', label: t.admin.nav.courses, icon: BookOpen, exact: false },
  { href: '/admin/categories', label: t.admin.nav.categories, icon: Layers, exact: false },
  { href: '/admin/users', label: t.admin.nav.users, icon: Users, exact: false },
  { href: '/admin/orders', label: t.admin.nav.orders, icon: Receipt, exact: false },
] as const;

/**
 * Administrative navigation.
 *
 * Horizontal scroller on mobile, vertical rail from `lg`.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label={t.admin.title}>
      <p className="mb-3 px-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
        {t.admin.title}
      </p>

      <ul className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
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

        <li className="shrink-0 lg:mt-2 lg:shrink lg:border-t lg:border-hairline lg:pt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 whitespace-nowrap rounded-card px-3.5 py-2.5 text-sm font-medium text-body transition-colors hover:bg-surface-muted hover:text-heading lg:w-full"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0 text-faint" />
            {t.admin.nav.backToSite}
          </Link>
        </li>
      </ul>
    </nav>
  );
}

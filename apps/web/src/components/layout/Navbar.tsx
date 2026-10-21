'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import type { CategoryDto } from '@nagis/shared-types';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/auth/SessionProvider';
import { CategoryIcon } from '@/components/courses/CategoryIcon';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV_LINKS = [
  { href: '/', label: t.nav.home },
  { href: '/courses', label: t.nav.courses },
  { href: '/about', label: t.nav.about },
] as const;

type MenuKind = 'mobile' | 'categories' | 'user';

export function Navbar({ categories }: { categories: CategoryDto[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, signOut, pending } = useSession();

  /**
   * One open menu at a time, tagged with the route it was opened on.
   *
   * Tagging means a route change closes every menu implicitly during render —
   * no effect, no cascading re-render, and no stale dropdown left hanging
   * over the new page.
   */
  const [menu, setMenu] = useState<{ kind: MenuKind | null; path: string }>({
    kind: null,
    path: pathname,
  });
  const openKind = menu.path === pathname ? menu.kind : null;

  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');

  const categoriesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = useCallback(
    (kind: MenuKind) =>
      setMenu((current) => ({
        kind: current.path === pathname && current.kind === kind ? null : kind,
        path: pathname,
      })),
    [pathname],
  );

  const closeMenus = useCallback(
    () => setMenu({ kind: null, path: pathname }),
    [pathname],
  );

  // Hairline + blur appear only once the page has scrolled. setState here is
  // inside a subscription callback, which is the intended use of an effect.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Dismiss dropdowns on outside click and on Escape.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const insideCategories = categoriesRef.current?.contains(target) ?? false;
      const insideUser = userMenuRef.current?.contains(target) ?? false;
      if (!insideCategories && !insideUser) closeMenus();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenus();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeMenus]);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (openKind !== 'mobile') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [openKind]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/courses?q=${encodeURIComponent(trimmed)}` : '/courses');
    closeMenus();
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const mobileOpen = openKind === 'mobile';
  const categoriesOpen = openKind === 'categories';
  const userMenuOpen = openKind === 'user';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300',
        scrolled
          ? 'border-b border-hairline bg-canvas/85 backdrop-blur-xl supports-[backdrop-filter]:bg-canvas/70'
          : 'border-b border-transparent bg-canvas',
      )}
    >
      <nav className="container-page" aria-label={t.nav.home}>
        <div className="flex h-16 items-center gap-3 lg:h-18">
          <Link
            href="/"
            onClick={closeMenus}
            className="shrink-0 rounded-md transition-opacity hover:opacity-85"
          >
            <Logo size="sm" className="lg:hidden" />
            <Logo size="md" className="hidden lg:inline-flex" />
          </Link>

          {/* ---- Desktop navigation ---- */}
          <div className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative rounded-pill px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'text-heading'
                    : 'text-muted hover:bg-surface-muted hover:text-heading',
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-pill bg-accent-600"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}

            <div ref={categoriesRef} className="relative">
              <button
                type="button"
                onClick={() => toggleMenu('categories')}
                aria-expanded={categoriesOpen}
                aria-haspopup="true"
                className={cn(
                  'flex items-center gap-1 rounded-pill px-3.5 py-2 text-sm font-medium transition-colors',
                  categoriesOpen
                    ? 'bg-surface-muted text-heading'
                    : 'text-muted hover:bg-surface-muted hover:text-heading',
                )}
              >
                {t.nav.categories}
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200',
                    categoriesOpen && 'rotate-180',
                  )}
                />
              </button>

              <AnimatePresence>
                {categoriesOpen && categories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full mt-2 w-[34rem] origin-top-left rounded-panel border border-hairline bg-surface p-2 shadow-lifted"
                  >
                    <div className="grid grid-cols-2 gap-0.5">
                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/courses?category=${encodeURIComponent(category.slug)}`}
                          className="group flex items-start gap-3 rounded-card p-2.5 transition-colors hover:bg-surface-muted"
                        >
                          <CategoryIcon
                            name={category.icon}
                            accent={category.accent}
                            className="mt-0.5 h-8 w-8 shrink-0"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-heading">
                              {category.name}
                            </span>
                            <span className="block text-xs text-faint">
                              {t.categories.courseCount(category.courseCount)}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-1 border-t border-hairline pt-1">
                      <Link
                        href="/courses"
                        className="block rounded-card px-2.5 py-2 text-sm font-medium text-accent-600 transition-colors hover:bg-surface-muted"
                      >
                        {t.categories.viewAll} →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1" />

          {/* ---- Desktop search ---- */}
          <form onSubmit={submitSearch} role="search" className="hidden items-center md:flex">
            <label htmlFor="navbar-search" className="sr-only">
              {t.catalog.searchLabel}
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
              />
              <input
                id="navbar-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.common.searchPlaceholder}
                className="h-10 w-44 rounded-pill border border-hairline bg-surface-muted pl-9 pr-3 text-sm text-body transition-[width,background-color,border-color] duration-250 placeholder:text-faint focus:w-60 focus:border-accent-400 focus:bg-surface focus:outline-none lg:w-52 lg:focus:w-72"
              />
            </div>
          </form>

          <ThemeToggle className="hidden sm:inline-flex" />

          {/* ---- Auth area ---- */}
          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated && user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => toggleMenu('user')}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-pill border border-hairline bg-surface py-1 pl-1 pr-2.5 transition-colors hover:bg-surface-muted"
                >
                  <Avatar user={user} />
                  <span className="max-w-24 truncate text-sm font-medium text-heading">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'h-3.5 w-3.5 text-faint transition-transform duration-200',
                      userMenuOpen && 'rotate-180',
                    )}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-2 w-60 origin-top-right rounded-panel border border-hairline bg-surface p-1.5 shadow-lifted"
                    >
                      <div className="border-b border-hairline px-3 pb-2.5 pt-2">
                        <p className="truncate text-sm font-semibold text-heading">{user.fullName}</p>
                        <p className="truncate text-xs text-faint">{user.email}</p>
                      </div>

                      <MenuLink href="/dashboard" icon={LayoutDashboard}>
                        {t.nav.dashboard}
                      </MenuLink>
                      <MenuLink href="/dashboard/settings" icon={Settings}>
                        {t.nav.settings}
                      </MenuLink>
                      {isAdmin && (
                        <MenuLink href="/admin" icon={Shield}>
                          {t.nav.admin}
                        </MenuLink>
                      )}

                      <div className="mt-1 border-t border-hairline pt-1">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void signOut()}
                          disabled={pending}
                          className="flex w-full items-center gap-2.5 rounded-card px-3 py-2 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)] disabled:opacity-60"
                        >
                          <LogOut aria-hidden="true" className="h-4 w-4" />
                          {t.nav.logout}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Button href="/login" variant="ghost" size="sm">
                  {t.nav.login}
                </Button>
                <Button href="/register" variant="ink" size="sm">
                  {t.nav.register}
                </Button>
              </>
            )}

            <LanguageSwitcher />
          </div>

          {/* ---- Mobile toggle ---- */}
          <button
            type="button"
            onClick={() => toggleMenu('mobile')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="flex h-10 w-10 items-center justify-center rounded-pill border border-hairline bg-surface text-heading transition-colors hover:bg-surface-muted lg:hidden"
          >
            {mobileOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
            <span className="sr-only">{mobileOpen ? t.nav.closeMenu : t.nav.openMenu}</span>
          </button>
        </div>
      </nav>

      {/* ---- Mobile sheet ---- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-hairline bg-surface lg:hidden"
          >
            <div className="container-page max-h-[calc(100dvh-4rem)] space-y-5 overflow-y-auto py-5">
              <form onSubmit={submitSearch} role="search">
                <label htmlFor="mobile-search" className="sr-only">
                  {t.catalog.searchLabel}
                </label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                  />
                  <input
                    id="mobile-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t.common.searchPlaceholder}
                    className="h-12 w-full rounded-pill border border-hairline bg-surface-muted pl-10 pr-4 text-base text-body placeholder:text-faint focus:border-accent-400 focus:bg-surface focus:outline-none"
                  />
                </div>
              </form>

              <div className="space-y-0.5">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'block rounded-card px-3 py-3 text-base font-medium transition-colors',
                      isActive(link.href)
                        ? 'bg-surface-muted text-heading'
                        : 'text-body hover:bg-surface-muted',
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {categories.length > 0 && (
                <div>
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
                    {t.nav.categories}
                  </p>
                  <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/courses?category=${encodeURIComponent(category.slug)}`}
                        className="flex items-center gap-3 rounded-card px-3 py-2.5 transition-colors hover:bg-surface-muted"
                      >
                        <CategoryIcon
                          name={category.icon}
                          accent={category.accent}
                          className="h-8 w-8 shrink-0"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-body">
                          {category.name}
                        </span>
                        <span className="text-xs text-faint">{category.courseCount}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-hairline pt-4">
                <span className="text-sm text-muted">{t.dashboard.settings.languageTitle}</span>
                <LanguageSwitcher />
              </div>

              <div className="flex items-center justify-between border-t border-hairline pt-4">
                <span className="text-sm text-muted">{t.nav.toggleTheme}</span>
                <ThemeToggle />
              </div>

              <div className="border-t border-hairline pt-4">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-1">
                      <Avatar user={user} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-heading">
                          {user.fullName}
                        </p>
                        <p className="truncate text-xs text-faint">{user.email}</p>
                      </div>
                    </div>
                    <Button href="/dashboard" variant="secondary" full>
                      {t.nav.dashboard}
                    </Button>
                    {isAdmin && (
                      <Button href="/admin" variant="subtle" full>
                        {t.nav.admin}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      full
                      loading={pending}
                      onClick={() => void signOut()}
                      className="text-[var(--color-danger)]"
                    >
                      {t.nav.logout}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button href="/login" variant="secondary" full>
                      {t.nav.login}
                    </Button>
                    <Button href="/register" variant="primary" full>
                      {t.nav.register}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-card px-3 py-2 text-sm font-medium text-body transition-colors hover:bg-surface-muted hover:text-heading"
    >
      <Icon aria-hidden="true" className="h-4 w-4 text-faint" />
      {children}
    </Link>
  );
}

/** Initials avatar. Avatar uploads do not exist yet, so avatarUrl is null. */
function Avatar({ user }: { user: { fullName: string; avatarUrl: string | null } }) {
  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-gradient-to-br from-accent-500 to-violet-accent text-xs font-bold text-white"
    >
      {initials || '?'}
    </span>
  );
}

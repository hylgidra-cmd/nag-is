'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { USER_ROLES } from '@nagis/shared-types';
import { t } from '@/i18n';
import { Select } from '@/components/ui/Field';

const SEARCH_DEBOUNCE_MS = 350;

/** Name/email search and role filter, both held in the URL. */
export function AdminUserFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(params.get('q') ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete('page');
      const serialised = next.toString();
      startTransition(() => {
        router.push(serialised ? `/admin/users?${serialised}` : '/admin/users', {
          scroll: false,
        });
      });
    },
    [params, router],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function onQueryChange(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      navigate((next) => {
        const trimmed = value.trim();
        if (trimmed) {
          next.set('q', trimmed);
        } else {
          next.delete('q');
        }
      });
    }, SEARCH_DEBOUNCE_MS);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <label htmlFor="admin-user-search" className="sr-only">
          {t.admin.users.searchPlaceholder}
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
        />
        <input
          id="admin-user-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t.admin.users.searchPlaceholder}
          className="h-11 w-full rounded-card border border-hairline bg-surface pl-10 pr-10 text-sm text-body placeholder:text-faint focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-accent-500)_22%,transparent)]"
        />
        {isPending && (
          <Loader2
            aria-hidden="true"
            className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent-600 motion-reduce:animate-none"
          />
        )}
      </div>

      <div>
        <label htmlFor="admin-user-role" className="sr-only">
          {t.admin.users.roleFilter}
        </label>
        <Select
          id="admin-user-role"
          value={params.get('role') ?? ''}
          onChange={(event) =>
            navigate((next) => {
              if (event.target.value) {
                next.set('role', event.target.value);
              } else {
                next.delete('role');
              }
            })
          }
          className="sm:w-52"
        >
          <option value="">{t.common.all}</option>
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {t.admin.users.roles[role]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

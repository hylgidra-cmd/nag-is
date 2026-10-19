'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

type ThemeChoice = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'nagis-theme';
/** Same-tab change notifications; `storage` only fires in *other* tabs. */
const CHANGE_EVENT = 'nagis:theme-change';

/**
 * localStorage is an external system, so it is read through
 * `useSyncExternalStore` rather than copied into state inside an effect.
 *
 * That gives correct hydration for free: React uses `getServerSnapshot`
 * ("system") for the server HTML and re-reads the real value immediately
 * after hydration, with no cascading render and no `mounted` flag.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark') return value;
  } catch {
    // Private mode, blocked site data, or thumbnail capture: fall through.
  }
  return 'system';
}

/** The server cannot know the preference, so it renders the neutral default. */
function getServerSnapshot(): ThemeChoice {
  return 'system';
}

function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', choice);
  }

  try {
    if (choice === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, choice);
    }
  } catch {
    // A per-viewer convenience; failing to persist is not an error. The
    // attribute is already applied, so this session still looks right.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const OPTIONS: { value: ThemeChoice; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: t.dashboard.settings.themeLight },
  { value: 'dark', icon: Moon, label: t.dashboard.settings.themeDark },
  { value: 'system', icon: Monitor, label: t.dashboard.settings.themeSystem },
];

/**
 * Three-way theme switch: light, dark, or follow the OS.
 *
 * Light is the product default for the public site; dark is an explicit
 * preference. The inline script in the root layout applies the stored value
 * before first paint, so there is no flash of the wrong theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const select = useCallback((next: ThemeChoice) => {
    applyTheme(next);
  }, []);

  return (
    <div
      role="group"
      aria-label={t.nav.toggleTheme}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-pill border border-hairline bg-surface p-0.5',
        className,
      )}
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => select(value)}
            aria-pressed={active}
            title={label}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-pill transition-colors duration-200',
              active
                ? 'bg-ink-900 text-white dark:bg-accent-600'
                : 'text-faint hover:bg-surface-muted hover:text-body',
            )}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

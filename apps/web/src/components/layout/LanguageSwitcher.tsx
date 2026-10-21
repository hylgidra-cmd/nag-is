'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { LOCALES, getCurrentLocale, type Locale } from '@/i18n';
import { cn } from '@/lib/cn';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>('kaa');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentLocale(getCurrentLocale());
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  function handleSelect(code: Locale) {
    if (code === currentLocale) {
      setOpen(false);
      return;
    }

    // Set cookie for 1 year
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
    setCurrentLocale(code);
    setOpen(false);

    // Refresh page to apply new translations to both Server & Client components
    window.location.reload();
  }

  const currentItem = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0]!;

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
        className={cn(
          'flex items-center gap-1.5 rounded-pill border border-hairline bg-surface px-2.5 py-1.5 text-xs font-semibold text-heading transition-colors hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent-500/20',
          open && 'bg-surface-muted',
        )}
      >
        <Globe aria-hidden="true" className="h-3.5 w-3.5 text-faint" />
        <span className="inline-flex items-center gap-1">
          <span className="text-xs">{currentItem.flag}</span>
          <span className="uppercase tracking-wider">{currentItem.short}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-3 w-3 text-faint transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Languages"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 z-50 w-44 origin-top-right rounded-panel border border-hairline bg-surface p-1 shadow-lifted"
          >
            <div className="space-y-0.5">
              {LOCALES.map((locale) => {
                const isSelected = locale.code === currentLocale;
                return (
                  <button
                    key={locale.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(locale.code)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-card px-2.5 py-2 text-left text-xs font-medium transition-colors',
                      isSelected
                        ? 'bg-accent-500/10 text-accent-700 dark:text-accent-300'
                        : 'text-body hover:bg-surface-muted hover:text-heading',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{locale.flag}</span>
                      <span>{locale.label}</span>
                    </span>
                    {isSelected && (
                      <Check
                        aria-hidden="true"
                        className="h-3.5 w-3.5 text-accent-600 dark:text-accent-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


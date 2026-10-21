import { cookies } from 'next/headers';
import { kaa, type Dictionary } from './kaa';
import { uz } from './uz';
import { ru } from './ru';
import { en } from './en';

/**
 * Localisation registry.
 * Supports Qaraqalpaq, Uzbek, Russian, and English.
 */
export const locales = {
  kaa,
  uz,
  ru,
  en,
} as const;

export type Locale = keyof typeof locales;

export const DEFAULT_LOCALE: Locale = 'kaa';

export interface LocaleItem {
  code: Locale;
  label: string;
  short: string;
  flag: string;
}

export const LOCALES: readonly LocaleItem[] = [
  { code: 'kaa', label: 'Qaraqalpaqsha', short: 'QRR', flag: '🇺🇿' },
  { code: 'uz', label: "O'zbekcha", short: 'UZB', flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', short: 'RUS', flag: '🇷🇺' },
  { code: 'en', label: 'English', short: 'ENG', flag: '🇬🇧' },
] as const;

/** BCP-47-ish tags for the `lang` attribute and `Intl` formatting. */
export const localeMeta: Record<Locale, { htmlLang: string; label: string; intl: string }> = {
  kaa: { htmlLang: 'kaa-Latn', label: 'Qaraqalpaqsha', intl: 'kaa-Latn' },
  uz: { htmlLang: 'uz-Latn', label: "O'zbekcha", intl: 'uz-Latn' },
  ru: { htmlLang: 'ru', label: 'Русский', intl: 'ru' },
  en: { htmlLang: 'en', label: 'English', intl: 'en' },
};

/**
 * Retrieves the currently active locale.
 * On client, reads from document.cookie. On server, falls back to DEFAULT_LOCALE.
 */
export function getCurrentLocale(): Locale {
  if (typeof window !== 'undefined') {
    try {
      const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
      const val = match && match[1] ? decodeURIComponent(match[1]) : null;
      if (val && val in locales) return val as Locale;
    } catch {
      // fallback
    }
  }

  return DEFAULT_LOCALE;
}

export async function getServerLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    const val = store.get('NEXT_LOCALE')?.value;
    if (val && val in locales) return val as Locale;
  } catch {
    // Outside request context
  }
  return DEFAULT_LOCALE;
}

export function getDictionary(locale?: Locale): Dictionary {
  const active = locale ?? getCurrentLocale();
  return locales[active] ?? locales[DEFAULT_LOCALE];
}

/**
 * The dynamic dictionary for the active locale.
 *
 * Uses a Proxy so that both server and client components can continue to use
 * `import { t } from '@/i18n'` seamlessly without refactoring all callers.
 */
export const t: Dictionary = new Proxy({} as Dictionary, {
  get(_target, prop: string | symbol) {
    const dict = getDictionary();
    return Reflect.get(dict, prop);
  },
});

export type { Dictionary } from './kaa';
export { kaa } from './kaa';
export { uz } from './uz';
export { ru } from './ru';
export { en } from './en';

/* --------------------------------------------------------------------------
 * Error and validation code resolution
 * ----------------------------------------------------------------------- */

/**
 * Maps a machine code from the API onto copy in the active locale.
 */
export function resolveErrorMessage(code: string | undefined | null): string {
  const dict = getDictionary();
  if (!code) return dict.errors.INTERNAL;
  const table = dict.errors as Record<string, string>;
  return table[code] ?? dict.errors.INTERNAL;
}

/**
 * Resolves a field-level validation code to a localized message.
 */
export function resolveValidationMessage(code: string | undefined | null): string {
  const dict = getDictionary();
  if (!code) return dict.validation.required;
  const key = code.startsWith('validation.') ? code.slice('validation.'.length) : code;
  const table = dict.validation as Record<string, string>;
  return table[key] ?? table[code] ?? dict.errors.VALIDATION_FAILED;
}

/* --------------------------------------------------------------------------
 * Formatting
 * ----------------------------------------------------------------------- */

const MONTHS_BY_LOCALE: Record<Locale, readonly string[]> = {
  kaa: [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
  ],
  uz: [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
  ],
  ru: [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
};

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

export function formatDateLong(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const locale = getCurrentLocale();
  const months = MONTHS_BY_LOCALE[locale] ?? MONTHS_BY_LOCALE.kaa;
  const month = months[date.getMonth()] ?? '';
  if (locale === 'en') {
    return `${month} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

export function formatDayMonth(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatDuration(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const locale = getCurrentLocale();
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;

  if (locale === 'ru') {
    if (safe === 0) return '0 минут';
    if (hours === 0) return `${minutes} мин`;
    if (minutes === 0) return `${hours} ч`;
    return `${hours} ч ${minutes} мин`;
  }

  if (locale === 'en') {
    if (safe === 0) return '0 minutes';
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  }

  if (locale === 'uz') {
    if (safe === 0) return '0 daqiqa';
    if (hours === 0) return `${minutes} daqiqa`;
    if (minutes === 0) return `${hours} soat`;
    return `${hours} soat ${minutes} daqiqa`;
  }

  // Default: kaa
  if (safe === 0) return '0 minut';
  if (hours === 0) return `${minutes} minut`;
  if (minutes === 0) return `${hours} saat`;
  return `${hours} saat ${minutes} minut`;
}

export function formatDurationShort(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  const locale = getCurrentLocale();

  if (locale === 'ru') {
    if (hours === 0) return `${minutes} мин`;
    if (minutes === 0) return `${hours} ч`;
    return `${hours} ч ${minutes} мин`;
  }

  if (locale === 'en') {
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  }

  if (locale === 'uz') {
    if (hours === 0) return `${minutes} daq`;
    if (minutes === 0) return `${hours} soat`;
    return `${hours} s ${minutes} daq`;
  }

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} saat`;
  return `${hours} s ${minutes} min`;
}

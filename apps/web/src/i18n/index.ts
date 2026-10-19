import { kaa, type Dictionary } from './kaa';

/**
 * Localisation registry.
 *
 * Only Qaraqalpaq ships today, but the indirection is deliberate: adding a
 * locale means adding one file and one entry here, with no component changes.
 * `Dictionary` is derived from the kaa file, so a new locale that misses a key
 * is a type error rather than a blank label at runtime.
 */
export const locales = {
  kaa,
} as const;

export type Locale = keyof typeof locales;

export const DEFAULT_LOCALE: Locale = 'kaa';

/** BCP-47-ish tags for the `lang` attribute and `Intl` formatting. */
export const localeMeta: Record<Locale, { htmlLang: string; label: string; intl: string }> = {
  kaa: { htmlLang: 'kaa-Latn', label: 'Qaraqalpaqsha', intl: 'kaa-Latn' },
};

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return locales[locale];
}

/**
 * The dictionary for the active locale.
 *
 * Exported as a plain binding rather than a hook so server components,
 * client components and plain helpers can all use the same import. When a
 * second locale lands this becomes a function of the request locale.
 */
export const t: Dictionary = getDictionary(DEFAULT_LOCALE);

export type { Dictionary } from './kaa';
export { kaa } from './kaa';

/* --------------------------------------------------------------------------
 * Error and validation code resolution
 * ----------------------------------------------------------------------- */

/**
 * Maps a machine code from the API or from @nagis/shared-validation onto
 * Qaraqalpaq copy.
 *
 * The API deliberately returns stable codes rather than translated strings,
 * so wording lives here only. An unknown code falls back to the generic
 * message instead of leaking an English string into the interface.
 */
export function resolveErrorMessage(code: string | undefined | null): string {
  if (!code) return t.errors.INTERNAL;
  const table = t.errors as Record<string, string>;
  return table[code] ?? t.errors.INTERNAL;
}

/**
 * Resolves a field-level validation code such as
 * "validation.password.tooShort" to its Qaraqalpaq message.
 */
export function resolveValidationMessage(code: string | undefined | null): string {
  if (!code) return t.validation.required;
  const key = code.startsWith('validation.') ? code.slice('validation.'.length) : code;
  const table = t.validation as Record<string, string>;
  return table[key] ?? table[code] ?? t.errors.VALIDATION_FAILED;
}

/* --------------------------------------------------------------------------
 * Formatting
 * ----------------------------------------------------------------------- */

/**
 * Date formatting.
 *
 * Intl has no Qaraqalpaq locale data, so a numeric d.m.yyyy format is used —
 * unambiguous, and it avoids falling back to English month names in the
 * middle of a Qaraqalpaq sentence.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

/** Qaraqalpaq month names, for the few places a long date reads better. */
const MONTHS_KAA = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
] as const;

export function formatDateLong(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const month = MONTHS_KAA[date.getMonth()] ?? '';
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

/** Short day/month label for chart axes. */
export function formatDayMonth(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * "4 saat 20 minut", "45 minut", "6 saat".
 * Qaraqalpaq does not inflect these nouns after a numeral, so no plural rules
 * are needed — only the zero case is special.
 */
export function formatDuration(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  if (safe === 0) return '0 minut';

  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;

  if (hours === 0) return `${minutes} minut`;
  if (minutes === 0) return `${hours} saat`;
  return `${hours} saat ${minutes} minut`;
}

/** Compact duration for dense card rows: "4 s 20 min". */
export function formatDurationShort(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} saat`;
  return `${hours} s ${minutes} min`;
}

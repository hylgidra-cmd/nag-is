import { discountPercent, formatUzs, formatUzsWithUnit } from '@nagis/shared-types';
import {
  DEFAULT_LOCALE,
  formatDate,
  formatDateLong,
  formatDayMonth,
  formatDuration,
  formatDurationShort,
  resolveErrorMessage,
  resolveValidationMessage,
  t,
} from './index';

describe('locale wiring', () => {
  it('defaults to Qaraqalpaq', () => {
    expect(DEFAULT_LOCALE).toBe('kaa');
  });

  /**
   * The language requirement is the product's core promise, so this guards
   * against an English string slipping into a high-traffic label.
   */
  it('has Qaraqalpaq copy for the primary navigation', () => {
    expect(t.nav.home).toBe('Bas bet');
    expect(t.nav.courses).toBe('Kurslar');
    expect(t.nav.login).toBe('Kiriw');
    expect(t.nav.register).toBe('Dizimnen ótiw');
    expect(t.nav.logout).toBe('Shıǵıw');
  });

  it('uses Qaraqalpaq Latin letters where the orthography needs them', () => {
    // á ǵ ń ó ú ı must survive the module boundary intact.
    expect(t.hero.illustration.learn).toBe('Úyreniw');
    expect(t.categories.title).toBe('IT baǵdarları');
    expect(t.course.level.BEGINNER).toBe('Baslawshı');
  });

  it('covers every course level and lesson type', () => {
    for (const level of ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const) {
      expect(t.course.level[level]).toBeTruthy();
    }
    for (const type of ['VIDEO', 'ARTICLE', 'QUIZ'] as const) {
      expect(t.course.lessonType[type]).toBeTruthy();
    }
  });
});

describe('resolveErrorMessage', () => {
  it('maps a known API code to Qaraqalpaq copy', () => {
    expect(resolveErrorMessage('INVALID_CREDENTIALS')).toBe('Email yamasa parol nadurıs');
    expect(resolveErrorMessage('LESSON_LOCKED')).toBe(t.errors.LESSON_LOCKED);
  });

  it('falls back to the generic message rather than leaking a raw code', () => {
    expect(resolveErrorMessage('SOME_UNMAPPED_CODE')).toBe(t.errors.INTERNAL);
    expect(resolveErrorMessage(undefined)).toBe(t.errors.INTERNAL);
    expect(resolveErrorMessage(null)).toBe(t.errors.INTERNAL);
  });

  it('never returns an empty string', () => {
    for (const code of ['', 'x', 'UNAUTHORIZED', 'RATE_LIMITED']) {
      expect(resolveErrorMessage(code).length).toBeGreaterThan(0);
    }
  });
});

describe('resolveValidationMessage', () => {
  it('strips the "validation." prefix used by shared-validation', () => {
    expect(resolveValidationMessage('validation.password.tooShort')).toBe(
      'Parol keminde 8 belgiden turıwı kerek',
    );
    expect(resolveValidationMessage('validation.required')).toBe(
      'Bul maydan toltırılıwı shárt',
    );
  });

  it('accepts an already-stripped key', () => {
    expect(resolveValidationMessage('email.invalid')).toBe('Email mánzili nadurıs');
  });

  it('falls back for an unknown code', () => {
    expect(resolveValidationMessage('validation.nope')).toBe(t.errors.VALIDATION_FAILED);
  });

  /** Every code the shared schemas can emit must have Qaraqalpaq wording. */
  it('covers the codes emitted by shared-validation', () => {
    const codes = [
      'validation.required',
      'validation.email.invalid',
      'validation.password.tooShort',
      'validation.password.needsLower',
      'validation.password.needsUpper',
      'validation.password.needsDigit',
      'validation.password.mismatch',
      'validation.fullName.tooShort',
      'validation.fullName.invalidChars',
      'validation.terms.required',
      'validation.slug.invalid',
      'validation.rating.range',
      'validation.price.integer',
      'validation.certificate.codeInvalid',
    ];

    for (const code of codes) {
      expect(resolveValidationMessage(code)).not.toBe(t.errors.VALIDATION_FAILED);
    }
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0 minut'],
    [1, '1 minut'],
    [45, '45 minut'],
    [60, '1 saat'],
    [90, '1 saat 30 minut'],
    [383, '6 saat 23 minut'],
    [120, '2 saat'],
  ])('formats %i minutes as "%s"', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });

  it('clamps negative input to zero', () => {
    expect(formatDuration(-10)).toBe('0 minut');
  });

  it('has a compact variant for dense rows', () => {
    expect(formatDurationShort(45)).toBe('45 min');
    expect(formatDurationShort(90)).toBe('1 s 30 min');
    expect(formatDurationShort(120)).toBe('2 saat');
  });
});

describe('date formatting', () => {
  it('uses an unambiguous numeric format', () => {
    // Intl has no Qaraqalpaq data, so a numeric format avoids English month
    // names appearing inside Qaraqalpaq copy.
    expect(formatDate('2026-03-05T12:00:00.000Z')).toMatch(/^\d{2}\.\d{2}\.2026$/);
  });

  it('renders an em dash for a missing value instead of "Invalid Date"', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDateLong(null)).toBe('—');
  });

  it('uses Qaraqalpaq month names in the long form', () => {
    expect(formatDateLong('2026-03-15T12:00:00.000Z')).toContain('mart');
  });

  it('formats a short axis label', () => {
    expect(formatDayMonth('2026-03-05')).toBe('5.03');
  });
});

describe('money formatting', () => {
  it('groups thousands with a narrow no-break space', () => {
    // U+202F keeps "490 000" from wrapping mid-number.
    expect(formatUzs(490_000)).toBe(`490${' '}000`);
    expect(formatUzs(1_290_000)).toBe(`1${' '}290${' '}000`);
    expect(formatUzs(0)).toBe('0');
    expect(formatUzs(999)).toBe('999');
  });

  it('appends the Qaraqalpaq currency unit', () => {
    expect(formatUzsWithUnit(450_000)).toBe(`450${' '}000 som`);
  });

  it('computes a discount only when the compare price is genuinely higher', () => {
    expect(discountPercent(490_000, 690_000)).toBe(29);
    expect(discountPercent(490_000, 490_000)).toBeNull();
    expect(discountPercent(490_000, 400_000)).toBeNull();
    expect(discountPercent(490_000, null)).toBeNull();
    expect(discountPercent(0, 0)).toBeNull();
  });
});

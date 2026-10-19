/**
 * Money helpers.
 *
 * All monetary amounts in NAG'IS are stored and transported as integers in
 * UZS so`m. The so`m has no circulating subunit, so there is no need for a
 * minor-unit multiplier, and integers keep us clear of floating-point drift.
 */

export const CURRENCY_UZS = 'UZS' as const;

/** The so`m unit label, written in Qaraqalpaq Latin. */
export const UZS_UNIT_LABEL = 'som';

/** 1000000 -> "1 000 000", grouped with a narrow no-break space. */
export function formatUzs(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** 1000000 -> "1 000 000 som" */
export function formatUzsWithUnit(amount: number, unit: string = UZS_UNIT_LABEL): string {
  return `${formatUzs(amount)} ${unit}`;
}

/** Percentage off, rounded to a whole number. Returns null when not on sale. */
export function discountPercent(priceUzs: number, comparePriceUzs: number | null): number | null {
  if (!comparePriceUzs || comparePriceUzs <= priceUzs) return null;
  return Math.round(((comparePriceUzs - priceUzs) / comparePriceUzs) * 100);
}

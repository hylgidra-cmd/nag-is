'use client';

import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';
import { ApiError, isApiError } from './errors';
import { t } from '@/i18n';

/**
 * Applies an API failure to a React Hook Form.
 *
 * The API reports field problems as `{ fields: { password: ['validation...'] } }`
 * using the same machine codes as the client-side Zod schemas, so a server
 * rejection lands on the right input with Qaraqalpaq wording rather than
 * surfacing as a generic banner.
 *
 * Returns a form-level message for anything not attributable to a field.
 */
export function applyApiError<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  /** Fields that exist on this form; others fall back to the banner. */
  knownFields: readonly Path<TValues>[],
): string {
  if (!isApiError(error)) {
    // Unexpected: log for developers, show the generic message.
    console.error('[nagis] unexpected form error', error);
    return t.errors.INTERNAL;
  }

  const apiError = error as ApiError;

  if (apiError.isNetwork) return t.errors.NETWORK;

  const localised = apiError.localisedFields;
  let appliedAny = false;

  for (const [field, message] of Object.entries(localised)) {
    if ((knownFields as readonly string[]).includes(field)) {
      setError(field as Path<TValues>, { type: 'server', message });
      appliedAny = true;
    }
  }

  // Everything attributable landed on an input; no banner needed.
  if (appliedAny && Object.keys(localised).length > 0) {
    const unmapped = Object.keys(localised).filter(
      (field) => !(knownFields as readonly string[]).includes(field),
    );
    if (unmapped.length === 0) return '';
  }

  return apiError.localisedMessage;
}

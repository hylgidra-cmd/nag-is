import type { ApiErrorBody } from '@nagis/shared-types';
import { resolveErrorMessage, resolveValidationMessage, t } from '@/i18n';

/**
 * A failed API call, carrying the machine-readable code so callers can branch
 * on *what* went wrong and render Qaraqalpaq copy for it.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Field path -> validation codes, when the API rejected specific fields. */
  readonly fields: Record<string, string[]> | undefined;

  constructor(status: number, code: string, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  /** Qaraqalpaq message for this error, ready to show to the user. */
  get localisedMessage(): string {
    if (this.status === 0) return t.errors.NETWORK;
    return resolveErrorMessage(this.code);
  }

  /** Field errors translated into Qaraqalpaq, for form display. */
  get localisedFields(): Record<string, string> {
    if (!this.fields) return {};
    const out: Record<string, string> = {};
    for (const [field, codes] of Object.entries(this.fields)) {
      const first = codes[0];
      if (first) out[field] = resolveValidationMessage(first);
    }
    return out;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * True when the API rejected the request itself.
   *
   * For a route whose only input is an id, this means the id was malformed --
   * a non-UUID where a UUID is required. Such an id cannot identify a record,
   * so callers treat it as "not found" rather than letting it surface as a
   * server error.
   */
  get isBadRequest(): boolean {
    return this.status === 400;
  }

  /** True when the browser never reached the server. */
  get isNetwork(): boolean {
    return this.status === 0;
  }

  static network(cause?: unknown): ApiError {
    const error = new ApiError(0, 'NETWORK', 'Network request failed');
    if (cause instanceof Error) error.cause = cause;
    return error;
  }

  /** Builds an ApiError from a non-2xx response body. */
  static fromBody(status: number, body: unknown, fallbackPath: string): ApiError {
    if (typeof body === 'object' && body !== null) {
      const parsed = body as Partial<ApiErrorBody>;
      return new ApiError(
        parsed.statusCode ?? status,
        parsed.code ?? 'INTERNAL',
        parsed.message ?? `Request to ${fallbackPath} failed with ${status}`,
        parsed.fields,
      );
    }
    return new ApiError(status, 'INTERNAL', `Request to ${fallbackPath} failed with ${status}`);
  }
}

/** Narrowing helper, so callers do not need `instanceof` everywhere. */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Every error the API raises deliberately carries a stable machine code in
 * addition to its HTTP status. The web app maps the code onto Qaraqalpaq
 * copy, so wording lives in one place (`src/i18n/kaa.ts`) and the API never
 * has to know the user's language.
 */
export class AppError extends HttpException {
  readonly code: string;
  readonly fields?: Record<string, string[]>;

  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    fields?: Record<string, string[]>,
  ) {
    super({ statusCode: status, code, message, fields }, status);
    this.code = code;
    this.fields = fields;
  }

  static badRequest(code: string, message: string, fields?: Record<string, string[]>): AppError {
    return new AppError(HttpStatus.BAD_REQUEST, code, message, fields);
  }

  static unauthorized(code = 'UNAUTHORIZED', message = 'Authentication required'): AppError {
    return new AppError(HttpStatus.UNAUTHORIZED, code, message);
  }

  static forbidden(code = 'FORBIDDEN', message = 'Insufficient permissions'): AppError {
    return new AppError(HttpStatus.FORBIDDEN, code, message);
  }

  static notFound(code: string, message: string): AppError {
    return new AppError(HttpStatus.NOT_FOUND, code, message);
  }

  static conflict(code: string, message: string): AppError {
    return new AppError(HttpStatus.CONFLICT, code, message);
  }

  /** 402: the resource exists but requires payment first. */
  static paymentRequired(
    code = 'PAYMENT_REQUIRED',
    message = 'Payment is required for this resource',
  ): AppError {
    return new AppError(HttpStatus.PAYMENT_REQUIRED, code, message);
  }

  static unprocessable(code: string, message: string, fields?: Record<string, string[]>): AppError {
    return new AppError(HttpStatus.UNPROCESSABLE_ENTITY, code, message, fields);
  }

  static tooManyRequests(code = 'RATE_LIMITED', message = 'Too many requests'): AppError {
    return new AppError(HttpStatus.TOO_MANY_REQUESTS, code, message);
  }

  /** An external dependency (payment, video, mail) is unavailable. */
  static serviceUnavailable(code: string, message: string): AppError {
    return new AppError(HttpStatus.SERVICE_UNAVAILABLE, code, message);
  }
}

/** Stable error codes. Keep in sync with the i18n `errors` dictionary. */
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',

  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
  CURRENT_PASSWORD_WRONG: 'CURRENT_PASSWORD_WRONG',

  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_SLUG_TAKEN: 'CATEGORY_SLUG_TAKEN',
  CATEGORY_NOT_EMPTY: 'CATEGORY_NOT_EMPTY',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  COURSE_SLUG_TAKEN: 'COURSE_SLUG_TAKEN',
  COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',
  COURSE_HAS_NO_LESSONS: 'COURSE_HAS_NO_LESSONS',
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  LESSON_NOT_FOUND: 'LESSON_NOT_FOUND',
  LESSON_SLUG_TAKEN: 'LESSON_SLUG_TAKEN',
  LESSON_LOCKED: 'LESSON_LOCKED',

  ALREADY_ENROLLED: 'ALREADY_ENROLLED',
  NOT_ENROLLED: 'NOT_ENROLLED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',

  QUIZ_NOT_FOUND: 'QUIZ_NOT_FOUND',

  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_EMPTY: 'ORDER_EMPTY',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  ORDER_CONTAINS_FREE_COURSE: 'ORDER_CONTAINS_FREE_COURSE',
  ORDER_CONTAINS_OWNED_COURSE: 'ORDER_CONTAINS_OWNED_COURSE',

  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_PROVIDER_UNAVAILABLE: 'PAYMENT_PROVIDER_UNAVAILABLE',
  PAYMENT_SIGNATURE_INVALID: 'PAYMENT_SIGNATURE_INVALID',

  CERTIFICATE_NOT_FOUND: 'CERTIFICATE_NOT_FOUND',
  CERTIFICATE_NOT_EARNED: 'CERTIFICATE_NOT_EARNED',

  REVIEW_NOT_ALLOWED: 'REVIEW_NOT_ALLOWED',
  REVIEW_ALREADY_EXISTS: 'REVIEW_ALREADY_EXISTS',

  VIDEO_PROVIDER_NOT_CONFIGURED: 'VIDEO_PROVIDER_NOT_CONFIGURED',
  UPLOAD_REJECTED: 'UPLOAD_REJECTED',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

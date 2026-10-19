import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';
import { AppError, ErrorCode } from '../errors/app.error';

/**
 * Validates and *replaces* the incoming value with the schema's parsed
 * output, so controllers receive coerced, trimmed, defaulted data and never
 * the raw request.
 *
 * Failures are reported as a flat `{ field: [code, ...] }` map using the
 * machine codes defined in @nagis/shared-validation, which the web app
 * renders as Qaraqalpaq messages.
 */
@Injectable()
export class ZodValidationPipe<TOutput> implements PipeTransform {
  constructor(private readonly schema: ZodType<TOutput>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): TOutput {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const fields: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join('.') : '_';
      const bucket = fields[key];
      if (bucket) {
        bucket.push(issue.message);
      } else {
        fields[key] = [issue.message];
      }
    }

    throw AppError.badRequest(ErrorCode.VALIDATION_FAILED, 'Request validation failed', fields);
  }
}

/** Convenience factory: `@Body(zodBody(loginSchema))`. */
export function zodBody<T>(schema: ZodType<T>): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}

/** Convenience factory: `@Query(zodQuery(courseQuerySchema))`. */
export function zodQuery<T>(schema: ZodType<T>): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}

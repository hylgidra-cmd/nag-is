import { z } from 'zod';
import type { ArgumentMetadata } from '@nestjs/common';
import { ZodValidationPipe } from './zod-validation.pipe';
import { AppError } from '../errors/app.error';
import { courseQuerySchema, loginSchema } from '@nagis/shared-validation';

const META: ArgumentMetadata = { type: 'body' };

describe('ZodValidationPipe', () => {
  it('returns the parsed output, not the raw input', () => {
    const pipe = new ZodValidationPipe(
      z.object({ name: z.string().trim(), count: z.coerce.number() }),
    );

    // Whitespace trimmed and the string coerced to a number.
    expect(pipe.transform({ name: '  Aziza  ', count: '7' }, META)).toEqual({
      name: 'Aziza',
      count: 7,
    });
  });

  it('throws AppError with VALIDATION_FAILED', () => {
    const pipe = new ZodValidationPipe(loginSchema);
    expect(() => pipe.transform({ email: 'nope', password: '' }, META)).toThrow(AppError);

    try {
      pipe.transform({ email: 'nope', password: '' }, META);
      fail('expected the pipe to throw');
    } catch (error) {
      const appError = error as AppError;
      expect(appError.code).toBe('VALIDATION_FAILED');
      expect(appError.getStatus()).toBe(400);
    }
  });

  it('reports field errors keyed by field path, as machine codes', () => {
    const pipe = new ZodValidationPipe(loginSchema);

    try {
      pipe.transform({ email: 'not-an-email', password: '' }, META);
      fail('expected the pipe to throw');
    } catch (error) {
      const fields = (error as AppError).fields;
      expect(fields).toBeDefined();
      expect(fields?.['email']).toContain('validation.email.invalid');
      expect(fields?.['password']).toContain('validation.required');
    }
  });

  it('collects multiple codes for one field', () => {
    const pipe = new ZodValidationPipe(
      z.object({ password: z.string().min(8, 'too.short').regex(/[A-Z]/, 'needs.upper') }),
    );

    try {
      pipe.transform({ password: 'abc' }, META);
      fail('expected the pipe to throw');
    } catch (error) {
      expect((error as AppError).fields?.['password']).toEqual(['too.short', 'needs.upper']);
    }
  });

  it('uses "_" for errors with no field path', () => {
    const pipe = new ZodValidationPipe(
      z.object({ a: z.number() }).refine(() => false, { error: 'whole.form.invalid' }),
    );

    try {
      pipe.transform({ a: 1 }, META);
      fail('expected the pipe to throw');
    } catch (error) {
      expect((error as AppError).fields?.['_']).toContain('whole.form.invalid');
    }
  });

  /**
   * Catalog filters must degrade rather than 400: a hand-edited or stale URL
   * should still render a usable page.
   */
  describe('course query coercion', () => {
    const pipe = new ZodValidationPipe(courseQuerySchema);

    it('falls back to defaults for nonsense enum values', () => {
      const result = pipe.transform({ sort: 'banana', price: 'nonsense' }, { type: 'query' });
      expect(result.sort).toBe('newest');
      expect(result.price).toBe('all');
    });

    it('falls back for an unparseable page number', () => {
      expect(pipe.transform({ page: 'abc' }, { type: 'query' }).page).toBe(1);
      expect(pipe.transform({ page: '-5' }, { type: 'query' }).page).toBe(1);
    });

    it('normalises a single level into an array', () => {
      expect(pipe.transform({ level: 'BEGINNER' }, { type: 'query' }).level).toEqual([
        'BEGINNER',
      ]);
    });

    it('keeps a repeated level parameter as an array', () => {
      expect(
        pipe.transform({ level: ['BEGINNER', 'ADVANCED'] }, { type: 'query' }).level,
      ).toEqual(['BEGINNER', 'ADVANCED']);
    });

    it('caps perPage so a client cannot request the whole table', () => {
      expect(pipe.transform({ perPage: '10000' }, { type: 'query' }).perPage).toBe(12);
    });
  });
});

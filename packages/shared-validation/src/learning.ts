import { z } from 'zod';
import { ORDER_STATUSES, USER_ROLES } from '@nagis/shared-types';
import { DEFAULT_PER_PAGE, MAX_PER_PAGE } from './catalog';

const pageParam = z.coerce.number().int().min(1).max(10_000).catch(1);
const perPageParam = z.coerce.number().int().min(1).max(MAX_PER_PAGE).catch(DEFAULT_PER_PAGE);

/* --------------------------------------------------------------------------
 * Progress
 * -------------------------------------------------------------------------- */

export const lessonProgressSchema = z.object({
  /** Video position in seconds, used to resume playback. */
  lastPositionSeconds: z.coerce
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60)
    .optional(),
  notes: z.string().trim().max(10_000, 'validation.tooLong').nullish(),
});
export type LessonProgressInput = z.infer<typeof lessonProgressSchema>;

export const lessonNotesSchema = z.object({
  notes: z.string().trim().max(10_000, 'validation.tooLong'),
});
export type LessonNotesInput = z.infer<typeof lessonNotesSchema>;

/* --------------------------------------------------------------------------
 * Quizzes
 * -------------------------------------------------------------------------- */

export const quizSubmissionSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.uuid('validation.uuid.invalid'),
        /** null means the student left the question unanswered. */
        optionId: z.uuid('validation.uuid.invalid').nullable(),
      }),
    )
    .min(1, 'validation.quiz.noAnswers')
    .max(200),
});
export type QuizSubmissionInput = z.infer<typeof quizSubmissionSchema>;

export const quizUpsertSchema = z.object({
  title: z.string().trim().min(2, 'validation.tooShort').max(160, 'validation.tooLong'),
  description: z.string().trim().max(1000, 'validation.tooLong').nullish(),
  /** Percentage of total points required to pass. */
  passingScore: z.coerce.number().int().min(1).max(100).default(60),
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(2, 'validation.tooShort').max(1000, 'validation.tooLong'),
        explanation: z.string().trim().max(1000, 'validation.tooLong').nullish(),
        points: z.coerce.number().int().min(1).max(100).default(1),
        options: z
          .array(
            z.object({
              text: z.string().trim().min(1, 'validation.required').max(500, 'validation.tooLong'),
              isCorrect: z.boolean().default(false),
            }),
          )
          .min(2, 'validation.quiz.needsTwoOptions')
          .max(8)
          .refine((options) => options.filter((option) => option.isCorrect).length === 1, {
            error: 'validation.quiz.needsOneCorrect',
          }),
      }),
    )
    .min(1, 'validation.quiz.needsQuestion')
    .max(100),
});
export type QuizUpsertInput = z.infer<typeof quizUpsertSchema>;

/* --------------------------------------------------------------------------
 * Orders
 * -------------------------------------------------------------------------- */

/**
 * The client may only name the courses it wants. Prices are read from the
 * database when the order is created; any client-supplied amount is ignored.
 */
export const createOrderSchema = z.object({
  courseIds: z
    .array(z.uuid('validation.uuid.invalid'))
    .min(1, 'validation.order.empty')
    .max(20, 'validation.order.tooMany'),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderQuerySchema = z.object({
  page: pageParam,
  perPage: perPageParam,
  status: z.enum(ORDER_STATUSES).optional(),
});
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;

/* --------------------------------------------------------------------------
 * Admin: users
 * -------------------------------------------------------------------------- */

export const adminUserQuerySchema = z.object({
  page: pageParam,
  perPage: perPageParam,
  q: z.string().trim().max(120).optional(),
  role: z.enum(USER_ROLES).optional(),
});
export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;

export const adminUpdateUserSchema = z.object({
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
  fullName: z.string().trim().min(2).max(80).optional(),
});
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

/* --------------------------------------------------------------------------
 * Certificates
 * -------------------------------------------------------------------------- */

/** Printed on the certificate, e.g. NAGIS-7F3K-9QB2-XM41. */
export const CERTIFICATE_CODE_PATTERN = /^NAGIS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export const certificateCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(CERTIFICATE_CODE_PATTERN, 'validation.certificate.codeInvalid'));

export const verifyCertificateSchema = z.object({
  code: certificateCodeSchema,
});
export type VerifyCertificateInput = z.infer<typeof verifyCertificateSchema>;

import { z } from 'zod';

/**
 * Authentication schemas (Zod 4).
 *
 * These are shared by the NestJS validation pipe and the React Hook Form
 * resolvers, so a field can never be accepted by the browser and rejected by
 * the server for a different reason.
 *
 * Error *messages* are intentionally dot-separated machine codes. The web app
 * maps them onto Qaraqalpaq copy through `src/i18n/kaa.ts`; the API returns
 * them verbatim in its error envelope. One source of truth for the rules, one
 * source of truth for the wording.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z
  .string({ error: 'validation.required' })
  .trim()
  .min(1, 'validation.required')
  .max(254, 'validation.email.tooLong')
  .pipe(z.email('validation.email.invalid'))
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string({ error: 'validation.required' })
  .min(PASSWORD_MIN_LENGTH, 'validation.password.tooShort')
  .max(PASSWORD_MAX_LENGTH, 'validation.password.tooLong')
  .regex(/[a-z]/, 'validation.password.needsLower')
  .regex(/[A-Z]/, 'validation.password.needsUpper')
  .regex(/[0-9]/, 'validation.password.needsDigit');

export const fullNameSchema = z
  .string({ error: 'validation.required' })
  .trim()
  .min(2, 'validation.fullName.tooShort')
  .max(80, 'validation.fullName.tooLong')
  // Any Unicode letter plus combining marks, so Qaraqalpaq letters such as
  // a, g, n, o, u with diacritics are accepted, along with the modifier
  // apostrophe used in the g` and o` digraphs.
  .regex(/^[\p{L}\p{M}'‘’`\- .]+$/u, 'validation.fullName.invalidChars');

export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * The confirm-password and terms checks live only in the browser form; the
 * API never receives those fields.
 */
export const registerFormSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ error: 'validation.required' }),
    acceptTerms: z.literal(true, { error: 'validation.terms.required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    error: 'validation.password.mismatch',
  });
export type RegisterFormInput = z.input<typeof registerFormSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  // Login deliberately does not apply the strength rules: an existing account
  // may predate them, and echoing the policy on a login form leaks it.
  password: z.string({ error: 'validation.required' }).min(1, 'validation.required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string({ error: 'validation.required' }).min(16, 'validation.token.invalid'),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const resetPasswordFormSchema = z
  .object({
    token: z.string({ error: 'validation.required' }).min(16, 'validation.token.invalid'),
    password: passwordSchema,
    confirmPassword: z.string({ error: 'validation.required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    error: 'validation.password.mismatch',
  });
export type ResetPasswordFormInput = z.input<typeof resetPasswordFormSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string({ error: 'validation.required' }).min(1, 'validation.required'),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string({ error: 'validation.required' }).min(1, 'validation.required'),
    newPassword: passwordSchema,
    confirmPassword: z.string({ error: 'validation.required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    error: 'validation.password.mismatch',
  });
export type ChangePasswordFormInput = z.input<typeof changePasswordFormSchema>;

export const updateProfileSchema = z.object({
  fullName: fullNameSchema,
  headline: z.string().trim().max(120, 'validation.tooLong').nullish(),
  bio: z.string().trim().max(1000, 'validation.tooLong').nullish(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

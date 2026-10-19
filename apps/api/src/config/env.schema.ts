import { z } from 'zod';

/**
 * Environment contract.
 *
 * The process refuses to boot if this does not parse, so a missing secret is
 * a loud startup failure rather than a 500 discovered in production. Values
 * are parsed once and exposed through `AppConfigService`.
 */

const booleanish = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

const port = z.coerce.number().int().min(1).max(65_535);

/** A secret must be long enough to be worth the name. */
const secret = z.string().min(32, 'must be at least 32 characters');

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    DATABASE_URL: z.string().min(1).startsWith('postgres', 'must be a PostgreSQL connection URL'),

    API_PORT: port.default(3001),
    API_GLOBAL_PREFIX: z.string().default('api'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:3000')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),

    JWT_ACCESS_SECRET: secret,
    JWT_REFRESH_SECRET: secret,
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('30d'),
    AUTH_COOKIE_DOMAIN: z.string().optional(),
    AUTH_COOKIE_SECURE: booleanish.default(false),

    PASSWORD_HASH_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    THROTTLE_TTL_SECONDS: z.coerce.number().int().min(1).default(60),
    THROTTLE_LIMIT: z.coerce.number().int().min(1).default(120),
    THROTTLE_AUTH_LIMIT: z.coerce.number().int().min(1).default(10),

    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_LOCAL_DIR: z.string().default('./storage'),
    STORAGE_PUBLIC_BASE_URL: z.string().default('http://localhost:3001/api/v1/files'),
    S3_ENDPOINT: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),

    VIDEO_DRIVER: z.enum(['none', 'mux', 'vimeo', 'bunny']).default('none'),
    VIDEO_SIGNING_KEY: z.string().optional(),
    VIDEO_SIGNING_KEY_ID: z.string().optional(),
    VIDEO_PLAYBACK_TTL_SECONDS: z.coerce.number().int().min(60).default(7200),

    PAYMENT_DRIVER: z.enum(['dev', 'payme', 'click']).default('dev'),
    PAYMENT_CURRENCY: z.string().default('UZS'),
    PAYME_MERCHANT_ID: z.string().optional(),
    PAYME_MERCHANT_KEY: z.string().optional(),
    PAYME_CHECKOUT_URL: z.string().default('https://checkout.paycom.uz'),
    CLICK_MERCHANT_ID: z.string().optional(),
    CLICK_SERVICE_ID: z.string().optional(),
    CLICK_SECRET_KEY: z.string().optional(),

    MAIL_DRIVER: z.enum(['console', 'smtp']).default('console'),
    MAIL_FROM: z.string().default('NAGIS <no-reply@nagis.uz>'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    LOG_PRETTY: booleanish.default(false),

    NEXT_PUBLIC_SITE_URL: z.string().default('http://localhost:3000'),
  })
  /**
   * The development payment adapter fabricates successful payments. Allowing
   * it in production would mean handing out paid courses for free, so the
   * process refuses to start in that combination.
   */
  .refine((env) => !(env.NODE_ENV === 'production' && env.PAYMENT_DRIVER === 'dev'), {
    path: ['PAYMENT_DRIVER'],
    error:
      'PAYMENT_DRIVER="dev" is a development-only adapter and cannot run with NODE_ENV=production. Configure a real provider (payme or click).',
  })
  .refine(
    (env) => !(env.NODE_ENV === 'production' && !env.AUTH_COOKIE_SECURE),
    {
      path: ['AUTH_COOKIE_SECURE'],
      error: 'AUTH_COOKIE_SECURE must be true in production so session cookies require HTTPS.',
    },
  )
  .refine(
    (env) => env.JWT_ACCESS_SECRET !== env.JWT_REFRESH_SECRET,
    {
      path: ['JWT_REFRESH_SECRET'],
      error:
        'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET, otherwise a refresh token is accepted as an access token.',
    },
  )
  .refine(
    (env) =>
      env.PAYMENT_DRIVER !== 'payme' || Boolean(env.PAYME_MERCHANT_ID && env.PAYME_MERCHANT_KEY),
    {
      path: ['PAYME_MERCHANT_ID'],
      error: 'PAYME_MERCHANT_ID and PAYME_MERCHANT_KEY are required when PAYMENT_DRIVER="payme".',
    },
  )
  .refine(
    (env) =>
      env.PAYMENT_DRIVER !== 'click' ||
      Boolean(env.CLICK_MERCHANT_ID && env.CLICK_SERVICE_ID && env.CLICK_SECRET_KEY),
    {
      path: ['CLICK_MERCHANT_ID'],
      error:
        'CLICK_MERCHANT_ID, CLICK_SERVICE_ID and CLICK_SECRET_KEY are required when PAYMENT_DRIVER="click".',
    },
  )
  .refine(
    (env) =>
      env.STORAGE_DRIVER !== 's3' ||
      Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY),
    {
      path: ['S3_BUCKET'],
      error:
        'S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are required when STORAGE_DRIVER="s3".',
    },
  )
  .refine((env) => env.MAIL_DRIVER !== 'smtp' || Boolean(env.SMTP_HOST), {
    path: ['SMTP_HOST'],
    error: 'SMTP_HOST is required when MAIL_DRIVER="smtp".',
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Parses `process.env` and throws a single readable error listing every
 * problem, rather than failing one variable at a time across restarts.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (result.success) return result.data;

  const lines = result.error.issues.map((issue) => {
    const key = issue.path.join('.') || '(root)';
    return `  - ${key}: ${issue.message}`;
  });

  throw new Error(
    [
      'Invalid environment configuration. Fix these variables in your .env file:',
      ...lines,
      '',
      'See .env.example for the full contract.',
    ].join('\n'),
  );
}

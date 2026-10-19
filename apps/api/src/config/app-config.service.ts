import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema';

/**
 * Typed read-only view over the validated environment.
 *
 * Injecting this instead of `ConfigService` means every consumer gets real
 * types and no string keys, and nothing can read an unvalidated variable.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private get<K extends keyof Env>(key: K): Env[K] {
    // ConfigService<Env, true> already infers Env[K] here, so no assertion.
    return this.config.get(key, { infer: true });
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.get('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get port(): number {
    return this.get('API_PORT');
  }

  get globalPrefix(): string {
    return this.get('API_GLOBAL_PREFIX');
  }

  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS');
  }

  get siteUrl(): string {
    return this.get('NEXT_PUBLIC_SITE_URL');
  }

  get auth() {
    return {
      accessSecret: this.get('JWT_ACCESS_SECRET'),
      refreshSecret: this.get('JWT_REFRESH_SECRET'),
      accessTtl: this.get('JWT_ACCESS_TTL'),
      refreshTtl: this.get('JWT_REFRESH_TTL'),
      cookieDomain: this.get('AUTH_COOKIE_DOMAIN') || undefined,
      cookieSecure: this.get('AUTH_COOKIE_SECURE'),
      hashRounds: this.get('PASSWORD_HASH_ROUNDS'),
    } as const;
  }

  get throttle() {
    return {
      ttlSeconds: this.get('THROTTLE_TTL_SECONDS'),
      limit: this.get('THROTTLE_LIMIT'),
      authLimit: this.get('THROTTLE_AUTH_LIMIT'),
    } as const;
  }

  get storage() {
    return {
      driver: this.get('STORAGE_DRIVER'),
      localDir: this.get('STORAGE_LOCAL_DIR'),
      publicBaseUrl: this.get('STORAGE_PUBLIC_BASE_URL'),
      s3: {
        endpoint: this.get('S3_ENDPOINT'),
        region: this.get('S3_REGION'),
        bucket: this.get('S3_BUCKET'),
        accessKeyId: this.get('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.get('S3_SECRET_ACCESS_KEY'),
      },
    } as const;
  }

  get video() {
    return {
      driver: this.get('VIDEO_DRIVER'),
      signingKey: this.get('VIDEO_SIGNING_KEY'),
      signingKeyId: this.get('VIDEO_SIGNING_KEY_ID'),
      playbackTtlSeconds: this.get('VIDEO_PLAYBACK_TTL_SECONDS'),
    } as const;
  }

  get payments() {
    return {
      driver: this.get('PAYMENT_DRIVER'),
      currency: this.get('PAYMENT_CURRENCY'),
      payme: {
        merchantId: this.get('PAYME_MERCHANT_ID'),
        merchantKey: this.get('PAYME_MERCHANT_KEY'),
        checkoutUrl: this.get('PAYME_CHECKOUT_URL'),
      },
      click: {
        merchantId: this.get('CLICK_MERCHANT_ID'),
        serviceId: this.get('CLICK_SERVICE_ID'),
        secretKey: this.get('CLICK_SECRET_KEY'),
      },
    } as const;
  }

  get mail() {
    return {
      driver: this.get('MAIL_DRIVER'),
      from: this.get('MAIL_FROM'),
      smtp: {
        host: this.get('SMTP_HOST'),
        port: this.get('SMTP_PORT'),
        user: this.get('SMTP_USER'),
        password: this.get('SMTP_PASSWORD'),
      },
    } as const;
  }

  get logging() {
    return {
      level: this.get('LOG_LEVEL'),
      pretty: this.get('LOG_PRETTY'),
    } as const;
  }
}

import { validateEnv } from './env.schema';

/**
 * The environment contract is the last line of defence before a deployment
 * goes live with development settings. These tests cover the production
 * guards specifically: each one exists because the alternative is a silent
 * failure that looks like broken content rather than a misconfiguration.
 */

/** A minimal environment that parses, for use as a base in each case. */
function baseEnv(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    DATABASE_URL: 'postgresql://user:pw@db.example.com:5432/nagis',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    ...overrides,
  };
}

/** The settings a production boot needs beyond the base, all non-local. */
function productionEnv(overrides: Record<string, string> = {}): Record<string, string> {
  return baseEnv({
    NODE_ENV: 'production',
    AUTH_COOKIE_SECURE: 'true',
    PAYMENT_DRIVER: 'click',
    CLICK_MERCHANT_ID: 'merchant',
    CLICK_SERVICE_ID: 'service',
    CLICK_SECRET_KEY: 'secret',
    NEXT_PUBLIC_SITE_URL: 'https://nagis.example',
    STORAGE_PUBLIC_BASE_URL: 'https://nagis.example/api/v1/files',
    CORS_ORIGINS: '',
    ...overrides,
  });
}

describe('validateEnv', () => {
  it('accepts a development environment with no optional settings', () => {
    const env = validateEnv(baseEnv());
    expect(env.NODE_ENV).toBe('development');
    expect(env.API_PORT).toBe(3001);
  });

  it('accepts a fully configured production environment', () => {
    const env = validateEnv(productionEnv());
    expect(env.NODE_ENV).toBe('production');
    expect(env.CORS_ORIGINS).toEqual([]);
  });

  it('reports every problem at once rather than one per restart', () => {
    expect(() => validateEnv({ DATABASE_URL: 'not-a-postgres-url' })).toThrow(
      /JWT_ACCESS_SECRET[\s\S]*JWT_REFRESH_SECRET/,
    );
  });

  describe('production localhost guards', () => {
    /*
     * These three values are handed to real browsers, so a leftover localhost
     * default produces links pointing at the visitor's own machine.
     */
    it('rejects a localhost NEXT_PUBLIC_SITE_URL', () => {
      expect(() =>
        validateEnv(productionEnv({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })),
      ).toThrow(/NEXT_PUBLIC_SITE_URL still points at localhost/);
    });

    it('rejects a localhost STORAGE_PUBLIC_BASE_URL', () => {
      expect(() =>
        validateEnv(
          productionEnv({ STORAGE_PUBLIC_BASE_URL: 'http://localhost:3001/api/v1/files' }),
        ),
      ).toThrow(/STORAGE_PUBLIC_BASE_URL still points at localhost/);
    });

    it('rejects a localhost origin in CORS_ORIGINS', () => {
      expect(() =>
        validateEnv(productionEnv({ CORS_ORIGINS: 'https://nagis.example,http://localhost:3000' })),
      ).toThrow(/CORS_ORIGINS still contains a localhost origin/);
    });

    it.each(['127.0.0.1:3000', '[::1]:3000', 'localhost'])(
      'recognises %s as a loopback address',
      (host) => {
        expect(() =>
          validateEnv(productionEnv({ NEXT_PUBLIC_SITE_URL: `http://${host}` })),
        ).toThrow(/still points at localhost/);
      },
    );

    /*
     * The guard matches the host, not the string. A real domain that merely
     * contains "localhost" must still be accepted, or a legitimate deployment
     * would be blocked for no reason.
     */
    it.each(['https://my-localhost.example.com', 'https://nagis-localhost-demo.uz'])(
      'accepts %s, which only contains the word',
      (url) => {
        expect(() => validateEnv(productionEnv({ NEXT_PUBLIC_SITE_URL: url }))).not.toThrow();
      },
    );

    it('still allows localhost outside production', () => {
      expect(() =>
        validateEnv(baseEnv({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })),
      ).not.toThrow();
    });
  });

  describe('other production guards', () => {
    it('refuses the fabricating development payment driver', () => {
      expect(() => validateEnv(productionEnv({ PAYMENT_DRIVER: 'dev' }))).toThrow(
        /PAYMENT_DRIVER="dev"/,
      );
    });

    /*
     * There is no order-creation endpoint, so checkout genuinely is not
     * available. "none" is how a deployment says that truthfully, and it has
     * to be allowed in production or the platform could not be deployed at
     * all without inventing merchant credentials for an unimplemented driver.
     */
    it('allows PAYMENT_DRIVER="none" in production without provider credentials', () => {
      const env = validateEnv(
        productionEnv({
          PAYMENT_DRIVER: 'none',
          CLICK_MERCHANT_ID: '',
          CLICK_SERVICE_ID: '',
          CLICK_SECRET_KEY: '',
        }),
      );
      expect(env.PAYMENT_DRIVER).toBe('none');
    });

    it('defaults to "none" rather than a driver with no implementation', () => {
      expect(validateEnv(baseEnv()).PAYMENT_DRIVER).toBe('none');
    });

    it('requires secure session cookies', () => {
      expect(() => validateEnv(productionEnv({ AUTH_COOKIE_SECURE: 'false' }))).toThrow(
        /AUTH_COOKIE_SECURE must be true in production/,
      );
    });

    /*
     * If the two secrets match, a refresh token verifies as an access token,
     * which would let a long-lived credential be used as a short-lived one.
     */
    it('requires the two JWT secrets to differ', () => {
      const same = 'c'.repeat(32);
      expect(() =>
        validateEnv(productionEnv({ JWT_ACCESS_SECRET: same, JWT_REFRESH_SECRET: same })),
      ).toThrow(/JWT_REFRESH_SECRET must differ/);
    });
  });
});

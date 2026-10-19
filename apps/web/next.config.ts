import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';

/**
 * The repository keeps a single .env at its root, shared by the API and the
 * web app. Next only auto-loads `apps/web/.env`, so it is loaded here before
 * the config object is built. This runs in the Next.js process, so
 * NEXT_PUBLIC_* values are available for inlining at build time.
 */
const repoRoot = resolve(import.meta.dirname, '..', '..');
for (const candidate of [resolve(repoRoot, '.env'), resolve(import.meta.dirname, '.env')]) {
  if (existsSync(candidate)) {
    process.loadEnvFile(candidate);
    break;
  }
}

const apiInternalUrl = process.env['API_INTERNAL_URL'] ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fail the production build on a type error rather than shipping it.
  // Next 16 removed the `eslint` config key along with `next lint`; linting
  // runs as its own `npm run lint` step against eslint directly.
  typescript: { ignoreBuildErrors: false },

  /**
   * Proxy the API through this origin.
   *
   * The API sets its session cookies as HttpOnly with the refresh cookie
   * scoped to `path=/api/v1/auth`. Serving the API under the same origin as
   * the site is what makes those cookies first-party: the browser sends them
   * automatically, there is no CORS preflight, and no token ever needs to be
   * readable by JavaScript. It also mirrors how this deploys in production,
   * behind one reverse proxy.
   */
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiInternalUrl}/api/v1/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  images: {
    // Course thumbnails are administrator-supplied URLs. Only hosts listed
    // here can be optimised; anything else must be a local asset.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;

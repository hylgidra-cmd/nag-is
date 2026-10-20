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

/**
 * Where to proxy /api/v1 to, for local development and self-hosted runs.
 *
 * On Vercel this app does not proxy the API at all: a top-level rewrite in
 * vercel.json routes /api/* straight to the api service, so the request is
 * resolved by the platform before it ever reaches this app. Emitting a Next
 * rewrite there would also be useless, because rewrites are baked into the
 * routes manifest at build time while the service binding that carries the
 * API URL only resolves at runtime.
 *
 * The localhost default is scoped to non-production on purpose. A production
 * build must never silently fall back to a local address: with nothing
 * configured, no rewrite is emitted and the misconfiguration stays visible
 * instead of pointing at a machine that is not there.
 */
const isVercel = Boolean(process.env['VERCEL']);
const isProductionBuild = process.env.NODE_ENV === 'production';

const apiProxyTarget = isVercel
  ? undefined
  : (process.env['API_INTERNAL_URL'] ?? (isProductionBuild ? undefined : 'http://localhost:3001'));

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
    if (!apiProxyTarget) return [];

    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiProxyTarget}/api/v1/:path*`,
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

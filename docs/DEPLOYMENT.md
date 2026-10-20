# Deploying NAG'IS

The repository deploys as **one Vercel project containing two services**, built
independently and shipped together:

| Service | Root | Framework | Public route |
| --- | --- | --- | --- |
| `web` | `apps/web/` | Next.js | `/(.*)` |
| `api` | `apps/api/` | NestJS (auto-detected) | `/api/v1/(.*)` |

`vercel.json` at the repository root is the whole configuration. Two details
are worth knowing before changing it:

* **A service receives the original request path.** `GET /api/v1/courses`
  arrives at the API as `/api/v1/courses`, not `/courses`, so NestJS's global
  `api` prefix and URI versioning work unchanged. Nothing strips the prefix.
* **The API rewrite is scoped to `/api/v1/`, not `/api/`.** Next.js owns its own
  `/api` namespace; handing all of it to the backend would make Route Handlers
  unreachable if any are added later.

## How the web app reaches the API

Two different paths, for two different callers:

* **Browser** — requests go to the relative path `/api/v1/...`. The platform
  rewrite routes them to the API, so they are same-origin: the HttpOnly session
  cookies ride along automatically, there is no CORS preflight, and no token is
  ever readable by JavaScript.
* **Server components** — there is no origin to be relative to, so an absolute
  base is needed. A **service binding** supplies it: Vercel injects the API's
  internal URL as `API_INTERNAL_URL` at runtime, and the call skips the public
  edge entirely.

Do **not** set `API_INTERNAL_URL` by hand on the deployed web service. That
overrides the binding and pushes internal traffic back out through the public
internet.

Bindings resolve at runtime only, never during a build. That is safe here
because every data-fetching route renders dynamically — only `/_not-found` and
`/icon` are prerendered, and neither calls the API. If a page is ever made
static *and* fetches the API, its build will fail.

## Environment variables

Three variables are required for the process to start at all:
`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. Everything else has
a default — but several of those defaults point at `localhost`, and the schema
refuses to boot in production if they survive. See `.env.example` for the full
contract.

### `api` service

| Variable | Notes |
| --- | --- |
| `NODE_ENV` | `production`. Enables the guards below. |
| `DATABASE_URL` | **Pooled** connection string. Required. |
| `DIRECT_DATABASE_URL` | Unpooled, for migrations only. |
| `DATABASE_POOL_MAX` | Defaults to 3 when `VERCEL` is set. See below. |
| `JWT_ACCESS_SECRET` | Required, ≥32 chars. Must differ from the refresh secret. |
| `JWT_REFRESH_SECRET` | Required, ≥32 chars. |
| `AUTH_COOKIE_SECURE` | Must be `true`; production boot fails otherwise. |
| `NEXT_PUBLIC_SITE_URL` | Public origin. Must not be localhost. |
| `STORAGE_PUBLIC_BASE_URL` | `https://<domain>/api/v1/files`. Must not be localhost. |
| `CORS_ORIGINS` | Empty string is correct — the browser reaches the API same-origin. |
| `PAYMENT_DRIVER` | `none`. See "Payments" below. |

### `web` service

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Inlined at build time, so it is needed here too. |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `kaa`. |

Generate the two secrets with distinct values:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Why the pool cap is small

The API runs as many short-lived function instances rather than one process, so
the connection ceiling is *instances × `DATABASE_POOL_MAX`*, not the cap alone.
A low per-instance cap plus a connection pooler in front of PostgreSQL is what
keeps that product under the server's `max_connections`.

## Database

Migrations must not run through a transaction-mode pooler: DDL and advisory
locks need one stable session, and such a pooler hands out a different backend
per statement. `prisma.config.ts` therefore prefers `DIRECT_DATABASE_URL` and
falls back to `DATABASE_URL`, so local development needs no extra setting.

```bash
# Against the production database, from a machine with the direct URL set:
npm run db:migrate:deploy --workspace @nagis/api
```

Never run `migrate reset`, `db push`, or `db seed` against production. The seed
is development data: every row it writes carries `isDemo: true`, including
fourteen demo courses.

### Creating the first administrator

Registration always creates a `STUDENT` and exposes no role field, so there is
no way to self-promote. Create the admin deliberately:

```bash
npm run admin:create --workspace @nagis/api -- admin@yourdomain.example
```

The password is read from stdin, or generated and printed once if nothing is
piped in. It never passes through `argv`, which other processes can read and
the shell records in history. Promoting an account that already exists requires
`--promote`.

## Payments

`PAYMENT_DRIVER=none` is the correct production value today. There is no
order-creation endpoint, so a paid course cannot be bought; enrolling in one
requires an already-`PAID` `OrderItem` and otherwise returns
`PAYMENT_REQUIRED`. Free courses enrol normally.

`dev` is rejected under `NODE_ENV=production` because it is meant to fabricate
successful payments. Switching to `payme` or `click` requires that provider's
credentials *and* a checkout implementation, which does not exist yet.

## The deployment workflow

Vercel's GitHub integration deploys automatically, independently of any local
tooling:

```
change -> npm run typecheck && npm run lint && npm run test && npm run build
       -> review git diff for secrets and stray files
       -> commit  ->  push to main  ->  Vercel builds and deploys
       -> verify production
```

A push to `main` triggers a production deployment; any other branch or pull
request gets a preview deployment with its own URL, where each service talks to
its own matching preview counterpart through the binding.

Verify a deployment with:

```bash
curl -s https://<domain>/api/v1/health
```

It reports database connectivity and which drivers are active, so it
distinguishes "the app is up" from "the app can reach its database".

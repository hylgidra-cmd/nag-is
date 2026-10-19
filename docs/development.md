# NAG'IS — development setup

Everything below has been run on Windows 10 + Node 24 + Docker Desktop. Where
a step has a known failure mode, it is named rather than left to be
rediscovered.

---

## 1. Prerequisites

| Tool | Version used | Notes |
| --- | --- | --- |
| Node.js | 24.18.0 | `>=20.11` required (`process.loadEnvFile`) |
| npm | 11.16.0 | workspaces; npm 11 blocks install scripts by default |
| Docker | 29.7.2 | only to host PostgreSQL |
| PostgreSQL | 16 (container) | exposed on host port **5433** |

---

## 2. First-time setup

```bash
# 1. Environment
cp .env.example .env

# 2. Generate the two JWT secrets (they MUST differ)
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(48).toString('base64url'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(48).toString('base64url'))"
# paste both into .env

# 3. Database
npm run db:up            # docker compose up -d postgres

# 4. Dependencies + shared packages + Prisma client
npm install
npm run build:packages   # shared-types and shared-validation must be built first
npm run db:generate

# 5. Schema + demo content
npm run db:migrate
npm run db:seed
```

### Install scripts (npm 11)

npm 11 refuses postinstall scripts until approved. Prisma cannot work without
its engines, so these four are allow-listed in the root `package.json`:

```
prisma            downloads the schema engine
@prisma/engines   downloads the query/schema engines
esbuild           native binary used by tsx (the seed runner)
unrs-resolver     native resolver used by eslint
```

Two are **deliberately not** approved:

- `@scarf/scarf` — an analytics beacon, not needed to build or run.
- `@parcel/watcher` — an optional native build; the watchers fall back fine.

If `prisma generate` complains about a missing engine, run
`npm approve-scripts @prisma/engines && npm install`.

---

## 3. Running

```bash
npm run dev            # API :3001 and web :3000 together
npm run dev:api        # API only
npm run dev:web        # web only
```

| URL | What |
| --- | --- |
| http://localhost:3000 | web app |
| http://localhost:3001/api/v1 | API |
| http://localhost:3001/api/docs | Swagger UI (non-production only) |
| http://localhost:3001/api/v1/health | liveness + which drivers are active |

### Why the web app proxies the API

`apps/web/next.config.ts` rewrites `/api/v1/*` to the API process. This is not
cosmetic:

- The API sets **HttpOnly** cookies, with the refresh cookie scoped to
  `path=/api/v1/auth`. Serving the API under the site's own origin makes those
  cookies first-party, so the browser sends them automatically.
- No CORS preflight, and **no token is ever readable by JavaScript** — nothing
  is kept in `localStorage` or `sessionStorage`.
- It mirrors production, where both sit behind one reverse proxy.

---

## 4. Demo credentials

Created by `npm run db:seed`, configurable in `.env`. Every seeded row carries
`isDemo = true`, so demo content is separable from real records:

```sql
SELECT count(*) FROM "Course" WHERE "isDemo" = true;
```

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@nagis.uz` | `Admin12345!` |
| Student | `student@nagis.uz` | `Student12345!` |
| Instructor | `aybek.qarataev@nagis.uz` | `Instructor12345!` |

**Development only.** Never seed a production database.

---

## 5. Checks

```bash
npm run typecheck     # all workspaces, strict
npm run lint          # eslint, type-aware on the API
npm run test          # 71 unit tests
npm run build         # shared packages -> api -> web
```

### Two build traps worth knowing

1. **`tsc --noEmit` and `nest build` must not share a `tsbuildinfo`.** They did
   initially, and after a typecheck the emit build believed everything was up to
   date and wrote **nothing** — an empty `dist/` with exit code 0. The typecheck
   script now writes `.tsbuildinfo.typecheck`, and `scripts/clean.mjs` removes
   stale files before each build.

2. **Do not add `loading.tsx` to `app/(public)/courses/`.** It wraps the
   `[slug]` child route too, and the Suspense boundary it creates makes Next
   commit a `200` before the detail page can raise `notFound()` — a missing
   course then renders the right page with the wrong status. The catalog
   skeleton is an explicit `<Suspense>` inside `courses/page.tsx` for this
   reason.

---

## 6. Integration boundaries (what is NOT wired up)

Each is a driver with a real boundary, not a stub pretending to work.

### Payments — `PAYMENT_DRIVER`

`dev` is the default and **refuses to load when `NODE_ENV=production`** (the
env schema rejects that combination at startup). No real payment is ever
taken.

Missing for a real launch:
- `POST /api/v1/orders` — server-created order (prices read from the database,
  never from the client)
- provider checkout redirect (Payme / Click)
- signed webhook verification; `PaymentWebhookEvent` already exists with a
  unique `(provider, externalEventId)` so replays are idempotent no-ops
- enrolment only after a verified `PAID` order — **this half is already
  enforced**: `POST /courses/:id/enroll` answers **402** for a paid course
  without a paid order.

The UI shows a disabled purchase button naming the missing endpoint rather
than a control that fails.

### Video — `VIDEO_DRIVER`

`none` by default. `VideoService.resolve()` returns `null`, and the lesson
payload carries `video: null`; the player shows a labelled placeholder and the
lesson text still works.

The stored `videoRef` is **never** serialised to a client. Access is checked
first (`EnrollmentsService.assertLessonAccess`), and only then is the
reference resolved into a short-lived playback descriptor. To add a provider,
implement the `mux`/`vimeo`/`bunny` branch — it currently rejects loudly rather
than returning something that looks valid.

### Email — `MAIL_DRIVER`

`console` writes the password-reset link to the server log instead of sending
mail, so the reset flow is fully testable. The flow is real end to end: the
token is single-use, expires in one hour, and resetting revokes every session.
`smtp` rejects with an explanatory error until a transport is implemented.

### Storage — `STORAGE_DRIVER`

`local` by default. No upload endpoint exists yet; course thumbnails are
administrator-supplied URLs.

### Also not built

- `POST /api/v1/quizzes/:id/attempts` — quiz grading. The quiz is served
  **without** `isCorrect` on options and without explanations, so the answer
  key is not in the payload; the UI shows a disabled start button.
- Module/lesson editing UI. The endpoints exist and work
  (`POST`/`PATCH`/`DELETE /admin/modules` and `/admin/lessons`, plus reorder);
  only the screen is missing, and the edit page names the endpoints.

---

## 7. Known issues

- **`Course.enrollmentCount` can drift.** It is recomputed on enrol, but
  deleting a user cascades the enrollment away without recomputing. Reconcile
  with:
  ```sql
  UPDATE "Course" c SET "enrollmentCount" = (
    SELECT count(*) FROM "Enrollment" e
    WHERE e."courseId" = c.id AND e.status IN ('ACTIVE','COMPLETED')
  );
  ```
  A cascade hook or scheduled job should replace this.

- **OneDrive.** This repo lives in a synced folder on one machine.
  `node_modules` there causes file locks and failed installs. `.npmrc` raises
  the fetch timeouts because large tarballs were resetting mid-download. If
  installs keep failing, move the checkout outside OneDrive, or pre-warm the
  cache: `npm cache add next@16.4.2 @prisma/client@7.10.1`.

- **Intl has no Qaraqalpaq locale data**, so dates are formatted manually
  (`d.MM.yyyy`, plus a hand-written month table) rather than through
  `Intl.DateTimeFormat`, which would emit English month names inside
  Qaraqalpaq copy.

---

## 8. Database operations

```bash
npm run db:migrate          # create + apply a migration (dev)
npm run db:migrate:deploy   # apply pending migrations (production)
npm run db:studio           # Prisma Studio
npm run db:reset            # DESTRUCTIVE: drop, re-migrate, re-seed
```

### Prisma 7 notes

Prisma 7 removed `url` from the `datasource` block. The connection string now
lives in `apps/api/prisma.config.ts` for CLI commands, and the runtime client
connects through the `@prisma/adapter-pg` driver adapter
(`src/common/prisma/prisma.service.ts`). Scripts share `prisma/client.ts` so
the seed and the server agree on pool settings.

Prisma CLI commands run through `apps/api/scripts/with-env.mjs`, which loads
the repository-root `.env` and puts the workspace `.bin` directories on PATH —
the Prisma CLI only looks next to the schema or in the cwd, and duplicating
secrets into `apps/api/.env` would be worse.

### Backups

Not automated. For a deployment, schedule:

```bash
docker exec nagis-postgres pg_dump -U nagis -d nagis -Fc > nagis-$(date +%F).dump
# restore
docker exec -i nagis-postgres pg_restore -U nagis -d nagis --clean < nagis-YYYY-MM-DD.dump
```

Keep backups off the application host, verify a restore before relying on it,
and rotate `JWT_*` secrets separately — restoring an old dump does not
invalidate tokens issued since.

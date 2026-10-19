# NAG'IS — architecture

## Shape

```
browser
   │
   │  same-origin: / and /api/v1/*
   ▼
Next.js (apps/web, :3000)
   │   • renders pages (mostly dynamic — the nav is session-dependent)
   │   • rewrites /api/v1/* ──────────────┐
   │   • server components forward the    │
   │     request's Cookie header          │
   ▼                                      ▼
                                   NestJS (apps/api, :3001)
                                      │  guards: Throttler → AccessToken → Roles
                                      │  Zod validation pipe
                                      ▼
                                   Prisma 7 + @prisma/adapter-pg
                                      ▼
                                   PostgreSQL 16
```

Both apps consume `packages/shared-types` (DTOs, enums) and
`packages/shared-validation` (Zod schemas), so the contract between them is
compiler-checked rather than conventional.

### Why the browser never talks to :3001 directly

The API issues **HttpOnly** cookies, with the refresh cookie scoped to
`path=/api/v1/auth`. Serving the API under the web origin via a Next rewrite
makes those cookies first-party, so:

- the browser attaches them automatically with no CORS preflight;
- no token is ever reachable from JavaScript (nothing in `localStorage`);
- the dev topology matches production behind one reverse proxy.

Server components have no browser to attach cookies, so `lib/api/server.ts`
forwards the incoming `Cookie` header explicitly. `publicGet` deliberately
omits it for genuinely public, cacheable reads, so one visitor's session can
never influence a cached response.

---

## Request lifecycle (API)

1. **ThrottlerGuard** — per-route limits; login is 10/min, reset 5/5min.
2. **AccessTokenGuard** — registered globally, so **every route is private by
   default**. A route opts out with `@Public()` (never resolves a user) or
   `@OptionalAuth()` (resolves one if a valid token is present). Reads the
   access cookie first, falls back to a bearer header for scripts and Swagger.
   An expired token on an optional route is treated as anonymous, so a stale
   cookie cannot lock a visitor out of a public course page.
3. **RolesGuard** — enforces `@Roles('ADMIN')`.
4. **ZodValidationPipe** — validates *and replaces* the payload with the
   parsed output, so handlers receive coerced, trimmed, defaulted data.
   Failures become `{ fields: { password: ['validation.password.tooShort'] } }`.
5. Handler → service → Prisma.
6. **AllExceptionsFilter** — one JSON envelope for every failure. Unexpected
   errors are logged with a stack but reported as a bare `INTERNAL`, because a
   Prisma message discloses table and query shape.

---

## Authentication

Two tokens with deliberately different properties:

| | Access | Refresh |
| --- | --- | --- |
| Form | signed JWT | `<rowId>.<secret>.<jwt>` composite |
| Lifetime | 15 min | 30 days |
| State | stateless | **row in `RefreshToken`** |
| Stored | nothing | SHA-256 digest of the secret only |
| Cookie path | `/` | `/api/v1/auth` |

Refresh requires all three parts to agree: the row must exist, the digest must
match, and the JWT must verify with the refresh secret. So neither a stolen
database row nor a forged JWT is sufficient alone.

Refreshing **rotates**. Presenting an already-revoked token is treated as
theft and revokes every live session for that user. The env schema refuses to
start if `JWT_ACCESS_SECRET === JWT_REFRESH_SECRET`, since that would let a
refresh token be replayed as an access token.

---

## Access control for paid content

One function decides it: `EnrollmentsService.assertLessonAccess`. Access is
granted when the lesson is a preview, the user has a live enrollment, or the
user is staff for that course. Everything else is refused, and an unpublished
course's lessons are reported as **404** rather than 403 so drafts cannot be
enumerated by probing.

Enforcement is layered:

- `GET /courses/:slug` computes `isAccessible` per lesson for the caller. The
  UI renders locked lessons as inert rows with **no `href`**, so the markup
  contains no address to share or guess.
- `GET /lessons/:id` re-runs the check. A client calling it directly gets 403.
- `videoRef` is never in any payload. It is resolved into a short-lived
  playback descriptor only *after* the access check passes.
- `POST /courses/:id/enroll` answers **402** for a paid course with no `PAID`
  order — the price and the payment state are both read from the database, so
  the client cannot enrol itself into paid content.

---

## Data model

16 tables. Full definitions in `apps/api/prisma/schema.prisma`.

```
User ──┬─< Enrollment >── Course ──> Category
       │                    │
       ├─< LessonProgress   ├─< CourseModule ──< Lesson ──┬── Quiz ──< QuizQuestion ──< QuizOption
       │                    │                            └─< LessonResource
       ├─< SavedCourse      ├─< Review
       ├─< Certificate      └─< OrderItem >── Order ──< Payment
       ├─< QuizAttempt
       ├─< RefreshToken
       ├─< PasswordResetToken
       └─< AuditLog                          PaymentWebhookEvent
```

### Conventions

- **UUID** primary keys in native `uuid` columns.
- **Money is `Int`**, whole UZS so`m. No float or decimal column exists. The
  so`m has no circulating subunit, so no minor-unit multiplier is needed.
- Content relations **cascade** from their parent; financial relations
  (`OrderItem → Course`, `Certificate → Course`, `Order → User`) use
  **Restrict**, so transaction history and issued certificates cannot be
  silently erased.
- `AuditLog.actorId` is **SET NULL** — the trail outlives the account.
- `isDemo` marks seeded rows, so demo content is separable from real records.

### Deliberate denormalisation

| Column | Why |
| --- | --- |
| `Course.ratingSum` / `ratingCount` / `ratingAverageBp` | Lets the catalog sort and filter by rating in SQL instead of loading every review per card. `ratingAverageBp` is the average × 100 as an integer (475 = 4.75). All three are 0 until a real review exists, and the API then reports `ratingAverage: null` rather than inventing a score. |
| `Course.enrollmentCount` | "Popular" sorting. Recomputed on enrol. *Known gap: deleting a user cascades the enrollment without recomputing — see docs/development.md.* |
| `LessonProgress.courseId` | Denormalised from `lesson → module → course`. Course-level progress and the dashboard aggregates are read far more often than a lesson moves between courses (which never happens), so removing two joins from every aggregate pays for itself. |

### Snapshots

`OrderItem` stores `courseTitle`, `courseSlug` and `unitPriceUzs`;
`Certificate` stores `recipientName`, `courseTitle`, `instructorName` and
`durationMinutes`. A later rename or price change therefore cannot alter a
receipt or an awarded certificate. Admin revenue reporting sums these
snapshots, not current prices.

### Idempotency

- `Payment.idempotencyKey` is unique — a retried create cannot double-charge.
- `PaymentWebhookEvent` is unique on `(provider, externalEventId)`, so a
  replayed provider delivery is a no-op.
- `Certificate` is unique on `(userId, courseId)`; issuance re-checks
  completion itself and returns the existing certificate when one exists, so
  it is safe to call repeatedly.

---

## Frontend structure

```
src/
  app/
    layout.tsx            root: <html lang="kaa-Latn">, pre-paint theme script
    (public)/             landing, catalog, course detail, verify  [+ nav/footer]
    (auth)/               login, register, forgot/reset  [no chrome; redirects if signed in]
    (dashboard)/          student area  [requires a session]
    (admin)/              admin area   [requires ADMIN]
    learn/[slug]/[lessonId]/   lesson player (own slim chrome)
  components/
    ui/        Button, Field, primitives (Card, Badge, Progress, Stars, StateBlock…)
    layout/    Navbar, Footer, ThemeToggle
    courses/   CourseCard, CatalogFilters, Curriculum, EnrollPanel, Pagination
    dashboard/ DashboardNav, SettingsForms
    admin/     AdminNav, CourseForm, CategoryManager, UserTable
    charts/    ActivityChart, CategoryDonut, TrendChart
    learning/  LessonPlayer, LessonNotes
  i18n/        kaa.ts (every string), index.ts (resolution + formatting)
  lib/api/     client, server, errors, safe, form
```

Most routes are `force-dynamic` because the navigation is personalised from
the session cookie; a statically prerendered shell would show the signed-out
navbar to signed-in visitors. The underlying catalog reads are still cached
(`revalidate: 60`), so this costs a cheap render rather than a cold API hit.

### URL as state

Catalog filters, admin filters and dashboard tabs all live in the query
string, not component state. Results are therefore shareable, bookmarkable and
correct under browser back/forward, and the server component re-renders from
one source of truth.

### Error handling

`lib/api/errors.ts` defines a single `ApiError` carrying the machine code, so
callers branch on *what* failed and render Qaraqalpaq copy for it.

`lib/api/safe.ts` has two helpers with different jobs:
- `safely()` — supporting data (nav categories, a secondary carousel). Returns
  a fallback so the page still renders its primary content.
- `settle()` — primary data. Distinguishes "empty" from "failed" so a section
  can show an error state rather than an empty one.

Both **re-throw Next.js control-flow signals** (`DYNAMIC_SERVER_USAGE`,
`NEXT_REDIRECT`, `NEXT_NOT_FOUND`). Swallowing those once caused Next to
prerender the landing page with a permanently signed-out navbar.

### Motion and accessibility

Animation uses `transform` and `opacity` only, so nothing triggers layout.
`prefers-reduced-motion` is honoured globally in `globals.css` and per
component via `useReducedMotion()` — `Reveal` renders its children with no
motion wrapper at all, so content is never hidden waiting for an animation
that will not run.

Every chart is `aria-hidden` and publishes the same numbers as a
visually-hidden table. Form fields wire label, hint and error together with
`aria-describedby`/`aria-invalid`, and error text always accompanies the
colour — colour is never the only signal.

---

## Known architectural gaps

- **No orders endpoint**, so no purchase path. The enrolment side already
  refuses unpaid access to paid courses (402).
- **No video provider.** The boundary exists and rejects loudly if a provider
  is configured but unimplemented, rather than returning a plausible-looking
  null.
- **No quiz grading endpoint.** The payload is already answer-key-free.
- **No upload endpoint**; thumbnails are administrator-supplied URLs, and only
  allow-listed hosts are permitted by `next.config.ts`.
- **Module/lesson editing has no UI**, though the API is complete.
- **`enrollmentCount` reconciliation** is manual (SQL in
  docs/development.md).

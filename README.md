# NAG'IS

Online IT education platform for Qaraqalpaqstan, Uzbekistan. The entire
learner-facing interface is in **Qaraqalpaq (Latin script)**.

> *naǵıs* — "genuine, true". The name is the promise: real skills, taught in
> the learner's own language.

---

## Quick start

```bash
cp .env.example .env     # then set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
npm run db:up            # PostgreSQL 16 in Docker, host port 5433
npm install
npm run build:packages   # shared packages must exist before the apps compile
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev              # API :3001, web :3000
```

Full setup, integration boundaries and known issues: **[docs/development.md](docs/development.md)**.
Architecture and data model: **[docs/architecture.md](docs/architecture.md)**.

Demo sign-in (development seed): `admin@nagis.uz` / `Admin12345!` and
`student@nagis.uz` / `Student12345!`.

---

## Stack

| Layer | Choice |
| --- | --- |
| Web | Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4 |
| Motion / charts | `motion` 14, Recharts 3 |
| Forms | React Hook Form 7 + Zod 4 (schemas shared with the API) |
| API | NestJS 11, REST under `/api/v1`, OpenAPI at `/api/docs` |
| Data | PostgreSQL 16, Prisma 7 via the `@prisma/adapter-pg` driver adapter |
| Auth | JWT access cookie + rotating refresh token, both HttpOnly; bcrypt |
| Monorepo | npm workspaces |

```
apps/
  api/     NestJS API, Prisma schema, migrations, seed
  web/     Next.js app
packages/
  shared-types/        DTOs and domain enums used by both sides
  shared-validation/   Zod schemas used by both sides
docs/
```

---

## Design decisions worth knowing

**One dictionary, no hardcoded copy.** Every learner-facing string lives in
`apps/web/src/i18n/kaa.ts`. The API returns stable machine codes
(`INVALID_CREDENTIALS`, `validation.password.tooShort`), never prose, so
wording has exactly one home and the API never needs to know the user's
language. Adding a locale is one file plus one registry entry.

**Validation is shared, not duplicated.** `packages/shared-validation` holds
the Zod schemas used by the NestJS validation pipe *and* the React Hook Form
resolvers, so a field cannot be accepted by the browser and rejected by the
server for a different reason.

**Money is always an integer.** Prices are whole UZS so`m — there is no
`Float` or `Decimal` column anywhere. Orders and certificates snapshot titles
and prices at the time of the transaction, so a later price change or course
rename cannot rewrite a receipt or an awarded certificate.

**The server is the only authority on access.** Routes are private by default:
`AccessTokenGuard` is registered globally and a route must opt out with
`@Public()` or `@OptionalAuth()`. `EnrollmentsService.assertLessonAccess` is
the single place that decides whether a lesson may be opened, and every route
serving lesson content goes through it. Admin routes are gated by
`@Roles('ADMIN')` + `RolesGuard` — hiding a link in the UI is presentation,
never protection.

**No fabricated data.** A course with no reviews reports `ratingAverage: null`
and the UI says "no rating yet" rather than drawing zero stars. Dashboard
numbers and charts are computed from real `LessonProgress` rows, so a new
account correctly shows zeroes. There are no invented learner counts,
testimonials or partnerships anywhere.

**Unfinished integrations say so.** Where a driver is not configured
(`VIDEO_DRIVER=none`, `PAYMENT_DRIVER=dev`) the UI states it plainly and names
the missing endpoint, instead of showing a control that silently fails. The
development payment adapter **refuses to start** under
`NODE_ENV=production`.

---

## Security posture

- Passwords: bcrypt, configurable cost (default 12). Login spends comparable
  CPU on an unknown address so response time does not reveal whether it is
  registered.
- Sessions: short-lived access JWT + a **stateful, rotating** refresh token.
  Only a SHA-256 digest is stored, so a leaked database is not replayable.
  Presenting an already-rotated token revokes the whole family.
- Both cookies are `HttpOnly` + `SameSite=Lax`; `AUTH_COOKIE_SECURE` must be
  `true` in production (enforced by the env schema).
- Password reset: single-use, 1-hour token, hash-only storage, and resetting
  revokes every session. The endpoint always answers 202 so it cannot be used
  to enumerate accounts.
- Rate limiting per route group (login 10/min, password reset 5/5min).
- Quiz payloads omit `isCorrect` and explanations until an attempt is graded.
- `videoRef` is never serialised to a client; playback is a short-lived
  descriptor issued only after an access check.
- Administrative mutations are written to an append-only `AuditLog` naming the
  acting administrator. `actorId` is `SET NULL` on user deletion so the trail
  outlives the account.
- An admin cannot demote or disable their own account, and the last active
  administrator cannot be removed.

---

## Checks

```bash
npm run typecheck   # strict, all workspaces
npm run lint        # eslint; type-aware rules on the API
npm run test        # 71 unit tests
npm run build       # shared packages -> api -> web
```

All four pass. See [docs/development.md](docs/development.md) for two
non-obvious build traps (a shared `tsbuildinfo`, and a `loading.tsx` that
silently breaks 404 status codes).

---

## Status

Working end to end: the landing page, catalog with search/filter/sort/
pagination, course detail with server-enforced lesson locking, registration /
login / logout / password reset, the student dashboard with real progress
charts, the lesson player with progress and notes persistence, automatic
certificate issuance on course completion, public certificate verification,
and an admin area (overview, course CRUD with publish control, category CRUD,
user role management, order list).

Not built: payment provider integration, video hosting integration, quiz
grading, file uploads, and the module/lesson editing screen (its API exists).
Each is listed with its missing endpoint in
[docs/development.md](docs/development.md#6-integration-boundaries-what-is-not-wired-up).

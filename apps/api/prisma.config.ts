/**
 * Prisma CLI configuration.
 *
 * Prisma 7 removed `url` from the `datasource` block in schema.prisma. The
 * connection string now lives here for CLI commands (migrate, db push,
 * studio, introspect), while the runtime client gets its connection through a
 * driver adapter — see src/common/prisma/prisma.service.ts.
 *
 * The repository keeps a single .env at its root, shared by the API and the
 * web app, so this file loads it explicitly rather than relying on Prisma's
 * own lookup (which only checks the schema directory and the cwd).
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

const repoRoot = resolve(import.meta.dirname, '..', '..');

for (const candidate of [
  resolve(repoRoot, '.env'),
  resolve(import.meta.dirname, '.env'),
]) {
  if (existsSync(candidate)) {
    process.loadEnvFile(candidate);
    break;
  }
}

/*
 * Migrations prefer a direct connection.
 *
 * A deployed API connects through a connection pooler, but schema migrations
 * cannot run over one in transaction mode: DDL and advisory locks need a
 * session that is stable for the whole migration, and a transaction-mode
 * pooler hands out a different backend per statement. DIRECT_DATABASE_URL is
 * that unpooled connection; locally there is no pooler, so DATABASE_URL is
 * used and nothing extra needs configuring.
 */
const databaseUrl =
  process.env['DIRECT_DATABASE_URL'] ??
  // Neon's Vercel integration injects the unpooled connection under its own
  // name. Accepting it here means the direct URL is not duplicated into a
  // second variable just to satisfy this file.
  process.env['DATABASE_URL_UNPOOLED'] ??
  process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error(
    'No database connection string found. Set DIRECT_DATABASE_URL (or ' +
      'DATABASE_URL_UNPOOLED, or DATABASE_URL). Locally, copy .env.example to ' +
      '.env in the repository root.',
  );
}

export default defineConfig({
  schema: resolve(import.meta.dirname, 'prisma', 'schema.prisma'),

  datasource: {
    url: databaseUrl,
  },

  migrations: {
    path: resolve(import.meta.dirname, 'prisma', 'migrations'),
    seed: 'node --import tsx prisma/seed.ts',
  },
});

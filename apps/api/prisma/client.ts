/**
 * Builds a PrismaClient for scripts (seed, maintenance, tests).
 *
 * Prisma 7 requires a driver adapter, so there is no longer a zero-argument
 * constructor. Keeping the construction here means the seed script and the
 * NestJS PrismaService agree on pool settings and on how DATABASE_URL is
 * resolved, instead of each inventing its own.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/** Loads the repository-root .env, which the API and web app share. */
export function loadEnv(): void {
  if (process.env['DATABASE_URL']) return;

  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '..', '.env'),
    resolve(import.meta.dirname ?? __dirname, '..', '..', '..', '.env'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate);
      return;
    }
  }
}

export function createPrismaClient(): PrismaClient {
  loadEnv();

  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env in the repository root.',
    );
  }

  // Scripts are short-lived and single-threaded, so a small pool is plenty.
  const adapter = new PrismaPg({ connectionString, max: 5 });
  return new PrismaClient({ adapter });
}

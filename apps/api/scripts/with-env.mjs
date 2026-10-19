#!/usr/bin/env node
/**
 * Runs a command with the repository-root .env loaded.
 *
 * The API and the web app share one .env at the repository root, but the
 * Prisma CLI only looks for .env next to the schema or in the current working
 * directory. Rather than duplicating secrets into apps/api/.env, every Prisma
 * script goes through this wrapper.
 *
 * It also puts the workspace `.bin` directories on PATH, so it behaves the
 * same whether it is invoked through `npm run` or directly with `node`.
 *
 * Uses node:process.loadEnvFile — no dotenv dependency.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, resolve } from 'node:path';

const packageDir = resolve(import.meta.dirname, '..');
const repoRoot = resolve(packageDir, '..', '..');

/* ---------------------------------------------------------------- env ---- */

const envCandidates = [resolve(repoRoot, '.env'), resolve(packageDir, '.env')];
const envFile = envCandidates.find((candidate) => existsSync(candidate));

if (!envFile) {
  console.error(
    'No .env file found. Copy .env.example to .env in the repository root first.\n' +
      `Looked in:\n${envCandidates.map((candidate) => `  - ${candidate}`).join('\n')}`,
  );
  process.exit(1);
}

process.loadEnvFile(envFile);

/* --------------------------------------------------------------- PATH ---- */

// npm adds these when running a script, but not when this file is run
// directly. Adding them here makes both paths behave identically.
const binDirs = [
  resolve(packageDir, 'node_modules', '.bin'),
  resolve(repoRoot, 'node_modules', '.bin'),
].filter((dir) => existsSync(dir));

if (binDirs.length > 0) {
  // Windows env vars are case-insensitive but process.env keys are not, so
  // find whichever casing is actually present.
  const pathKey =
    Object.keys(process.env).find((key) => key.toUpperCase() === 'PATH') ?? 'PATH';
  process.env[pathKey] = [...binDirs, process.env[pathKey] ?? ''].join(delimiter);
}

/* ------------------------------------------------------------- command --- */

const argv = process.argv.slice(2);

if (argv.length === 0) {
  console.error('Usage: node scripts/with-env.mjs <command> [args...]');
  process.exit(1);
}

/**
 * Passing an args array together with `shell: true` is deprecated in Node
 * (DEP0190), because the arguments are concatenated rather than escaped.
 * The shell is still needed so Windows can resolve the `.cmd` shims that npm
 * writes into `.bin`, so the command is quoted here and handed over as one
 * string.
 */
const quote = (part) => (/[\s"'&|<>^]/.test(part) ? JSON.stringify(part) : part);
const commandLine = argv.map(quote).join(' ');

const child = spawn(commandLine, {
  stdio: 'inherit',
  shell: true,
  cwd: packageDir,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(`Failed to run "${argv[0]}":`, error.message);
  process.exit(1);
});

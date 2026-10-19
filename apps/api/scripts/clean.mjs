#!/usr/bin/env node
/**
 * Clears build artefacts before `nest build`.
 *
 * The tsbuildinfo matters: `tsc --noEmit` (the typecheck script) and
 * `nest build` would otherwise share one incremental cache, and after a
 * typecheck the emit build believes everything is up to date and writes
 * NOTHING — producing an empty dist/ with a zero exit code.
 *
 * The typecheck script now uses its own buildinfo path, and this removes any
 * stale file left by an older checkout.
 */
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const packageDir = resolve(import.meta.dirname, '..');

for (const target of ['dist', 'tsconfig.tsbuildinfo', '.tsbuildinfo.typecheck']) {
  rmSync(resolve(packageDir, target), { recursive: true, force: true });
}

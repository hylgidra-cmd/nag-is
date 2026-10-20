/**
 * Creates (or promotes) a single administrator account.
 *
 * This exists because the only other way to get an admin is `prisma db seed`,
 * which also inserts fourteen demo courses and marks everything `isDemo: true`.
 * That is correct for development and wrong for production, so production needs
 * a path that creates exactly one real row and nothing else.
 *
 * Design constraints, all deliberate:
 *
 *  * The password is never passed as a command-line argument, because argv is
 *    visible to other processes and lands in shell history. It comes from
 *    stdin, or is generated here.
 *  * Password rules are imported from @nagis/shared-validation, the same schema
 *    registration uses, rather than restated. One place to change them.
 *  * Hashing uses bcrypt with PASSWORD_HASH_ROUNDS, matching AuthService.
 *  * An existing account is never silently overwritten: promoting one requires
 *    --promote, so a typo cannot reset a real user's password.
 *  * The row is written with `isDemo: false`. It is a real record.
 *
 * Usage:
 *   npm run admin:create --workspace @nagis/api -- <email> [--promote]
 *
 * The password is read from stdin if one is piped in; otherwise a strong
 * random password is generated and printed once.
 */

import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { passwordSchema } from '@nagis/shared-validation';
import { createPrismaClient } from '../prisma/client';

const prisma = createPrismaClient();

/* ----------------------------------------------------------------- args --- */

const argv = process.argv.slice(2);
const promote = argv.includes('--promote');
const email = argv.find((arg) => !arg.startsWith('--'))?.trim().toLowerCase();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:create --workspace @nagis/api -- <email> [--promote]');
  console.error('  <email>     the administrator address');
  console.error('  --promote   allow promoting an account that already exists');
  process.exit(1);
}

/* ------------------------------------------------------------- password --- */

/** Reads a piped password, or an empty string when stdin is a terminal. */
async function readPipedPassword(): Promise<string> {
  if (process.stdin.isTTY) return '';

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8').trim();
}

/**
 * Generates a password that satisfies passwordSchema by construction.
 *
 * Base64url alone can omit a required character class, so one of each is
 * placed explicitly and the remainder filled randomly.
 */
function generatePassword(): string {
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = lower + upper + digits;

  const pick = (set: string): string => set[randomBytes(1)[0]! % set.length]!;

  const chars = [pick(lower), pick(upper), pick(digits)];
  while (chars.length < 20) chars.push(pick(all));

  // Fisher-Yates with crypto randomness, so the required classes are not
  // always in the first three positions.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomBytes(1)[0]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join('');
}

/* ----------------------------------------------------------------- main --- */

async function main(): Promise<void> {
  const piped = await readPipedPassword();
  const generated = piped.length === 0;
  const password = generated ? generatePassword() : piped;

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    // The schema returns i18n keys rather than sentences, so they are listed raw.
    console.error('The supplied password does not meet the password policy:');
    for (const issue of parsed.error.issues) console.error(`  - ${issue.message}`);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, isDemo: true },
  });

  if (existing && !promote) {
    console.error(`An account already exists for ${email} (role=${existing.role}).`);
    console.error('Re-run with --promote to make it an administrator and set a new password.');
    process.exit(1);
  }

  const rounds = Number(process.env['PASSWORD_HASH_ROUNDS'] ?? 12);
  const passwordHash = await bcrypt.hash(password, rounds);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isDemo: false,
    },
    create: {
      email,
      passwordHash,
      fullName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
      isDemo: false,
      emailVerifiedAt: new Date(),
    },
    select: { id: true, email: true, role: true },
  });

  console.log(`${existing ? 'Promoted' : 'Created'} administrator ${user.email} (${user.role}).`);

  if (generated) {
    console.log('');
    console.log('  Generated password (shown once, not stored anywhere):');
    console.log(`      ${password}`);
    console.log('');
    console.log('  Save it in a password manager now, then sign in and change it.');
  }
}

main()
  .catch((error: unknown) => {
    console.error('Failed to create the administrator:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * Opaque secret generation and comparison.
 *
 * Nothing here invents cryptography: it is `node:crypto` primitives applied
 * the conventional way. Long random tokens are handed to the user; only their
 * SHA-256 digest is persisted, so a database leak yields nothing replayable.
 * SHA-256 (rather than bcrypt) is correct for these because the inputs are
 * already 256+ bits of entropy — there is nothing to brute-force.
 */

/** 48 bytes of entropy, URL-safe. */
export function generateOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

const HEX_ONLY = /^[0-9a-fA-F]+$/;

/**
 * Constant-time comparison of two hex digests.
 *
 * The inputs are validated as hex first. `Buffer.from(value, 'hex')` silently
 * stops at the first invalid character — `Buffer.from('zzzz', 'hex')` is an
 * EMPTY buffer — so without this guard two different malformed strings would
 * both decode to nothing and compare as equal. For a comparison used on
 * security material, that failure mode has to be closed explicitly.
 */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  if (a.length === 0) return false;
  if (!HEX_ONLY.test(a) || !HEX_ONLY.test(b)) return false;

  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

/** Unambiguous alphabet: no O/0, I/1, or confusable pairs. */
const CERT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Builds a certificate verification code such as NAGIS-7F3K-9QB2-XM41.
 *
 * Callers must retry on a unique-constraint violation; with 32^12 (~1.1e18)
 * possibilities a collision is vanishingly unlikely, but the database remains
 * the authority on uniqueness.
 */
export function generateCertificateCode(): string {
  const group = (): string =>
    Array.from({ length: 4 }, () => CERT_ALPHABET[randomInt(CERT_ALPHABET.length)]).join('');
  return `NAGIS-${group()}-${group()}-${group()}`;
}

/** Idempotency keys for payment creation. */
export function generateIdempotencyKey(): string {
  return `idem_${randomBytes(24).toString('hex')}`;
}

/**
 * Human-readable order reference, e.g. NAGIS-2026-8F3K2P.
 * The random suffix keeps references unguessable so one customer cannot probe
 * another's order by incrementing a number.
 */
export function generateOrderReference(now: Date = new Date()): string {
  const suffix = Array.from({ length: 6 }, () => CERT_ALPHABET[randomInt(CERT_ALPHABET.length)]).join(
    '',
  );
  return `NAGIS-${now.getUTCFullYear()}-${suffix}`;
}

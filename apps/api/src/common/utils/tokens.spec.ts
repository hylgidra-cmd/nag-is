import {
  generateCertificateCode,
  generateIdempotencyKey,
  generateOpaqueToken,
  generateOrderReference,
  hashToken,
  safeEqualHex,
} from './tokens';
import { CERTIFICATE_CODE_PATTERN } from '@nagis/shared-validation';

describe('token utilities', () => {
  describe('generateOpaqueToken', () => {
    it('produces URL-safe output with no padding', () => {
      const token = generateOpaqueToken();
      // base64url must not contain +, / or = — those break a query string.
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('does not repeat across calls', () => {
      const tokens = new Set(Array.from({ length: 200 }, () => generateOpaqueToken()));
      expect(tokens.size).toBe(200);
    });

    it('carries the requested entropy', () => {
      // 48 bytes -> 64 base64url characters.
      expect(generateOpaqueToken(48)).toHaveLength(64);
      expect(generateOpaqueToken(32)).toHaveLength(43);
    });
  });

  describe('hashToken', () => {
    it('is deterministic', () => {
      expect(hashToken('abc')).toBe(hashToken('abc'));
    });

    it('differs for different input', () => {
      expect(hashToken('abc')).not.toBe(hashToken('abd'));
    });

    it('returns a 64-character hex digest', () => {
      expect(hashToken('anything')).toMatch(/^[0-9a-f]{64}$/);
    });

    it('never returns the input, so a leaked row is not replayable', () => {
      const secret = generateOpaqueToken();
      expect(hashToken(secret)).not.toContain(secret);
    });
  });

  describe('safeEqualHex', () => {
    it('matches identical digests', () => {
      const digest = hashToken('x');
      expect(safeEqualHex(digest, digest)).toBe(true);
    });

    it('rejects different digests', () => {
      expect(safeEqualHex(hashToken('x'), hashToken('y'))).toBe(false);
    });

    it('rejects mismatched lengths without throwing', () => {
      expect(safeEqualHex('abcd', 'abcdef')).toBe(false);
    });

    it('rejects non-hex input without throwing', () => {
      // Buffer.from('zzzz','hex') decodes to an EMPTY buffer rather than
      // throwing, so without an explicit hex guard two different malformed
      // strings would compare as equal.
      expect(safeEqualHex('zzzz', 'zzzz')).toBe(false);
      expect(safeEqualHex('zzzz', 'yyyy')).toBe(false);
      expect(safeEqualHex('abcg', 'abcg')).toBe(false);
    });

    it('rejects empty input', () => {
      expect(safeEqualHex('', '')).toBe(false);
    });

    it('accepts mixed-case hex of equal length', () => {
      expect(safeEqualHex('ABCDEF', 'abcdef')).toBe(true);
    });
  });

  describe('generateCertificateCode', () => {
    it('matches the public verification format', () => {
      for (let index = 0; index < 50; index += 1) {
        expect(generateCertificateCode()).toMatch(CERTIFICATE_CODE_PATTERN);
      }
    });

    it('avoids visually confusable characters', () => {
      // O/0 and I/1 are excluded so a code can be read aloud or retyped.
      const codes = Array.from({ length: 200 }, () => generateCertificateCode())
        .join('')
        .replace(/NAGIS|-/g, '');
      expect(codes).not.toMatch(/[O01I]/);
    });

    it('is unlikely to collide', () => {
      const codes = new Set(Array.from({ length: 500 }, () => generateCertificateCode()));
      expect(codes.size).toBe(500);
    });
  });

  describe('generateOrderReference', () => {
    it('includes the year and an unguessable suffix', () => {
      const date = new Date('2026-03-15T00:00:00.000Z');
      const reference = generateOrderReference(date);
      expect(reference).toMatch(/^NAGIS-2026-[A-Z0-9]{6}$/);
    });

    it('is not sequential, so one customer cannot probe another order', () => {
      const date = new Date('2026-03-15T00:00:00.000Z');
      const references = new Set(
        Array.from({ length: 100 }, () => generateOrderReference(date)),
      );
      // Same date, still ~100 distinct references.
      expect(references.size).toBeGreaterThan(95);
    });
  });

  describe('generateIdempotencyKey', () => {
    it('is prefixed and unique', () => {
      const keys = new Set(Array.from({ length: 100 }, () => generateIdempotencyKey()));
      expect(keys.size).toBe(100);
      for (const key of keys) expect(key).toMatch(/^idem_[0-9a-f]{48}$/);
    });
  });
});

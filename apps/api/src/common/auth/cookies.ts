import type { Request } from 'express';

/**
 * Reads one cookie off the request, type-safely.
 *
 * `@types/express` declares `Request.cookies` as `any`, and an intersection
 * type like `Request & { cookies?: Record<string, string> }` does NOT override
 * that — the property stays `any`, so every read silently leaks an untyped
 * value into the codebase. This narrows from `unknown` instead, which is why
 * it is a shared helper rather than an inline cast at each call site.
 */
export function readCookie(request: Request, name: string): string | undefined {
  const bag: unknown = (request as { cookies?: unknown }).cookies;
  if (typeof bag !== 'object' || bag === null) return undefined;

  const value: unknown = (bag as Record<string, unknown>)[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

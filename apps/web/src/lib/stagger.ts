/**
 * Staggered animation delay for a list index.
 *
 * Deliberately lives outside the `'use client'` Reveal module: server
 * components compute these delays while rendering a list, and a function
 * exported from a client module cannot be called on the server.
 *
 * The delay is capped so the last card in a long grid does not wait
 * noticeably after the first.
 */
export function stagger(index: number, step = 0.05, max = 0.3): number {
  return Math.min(index * step, max);
}

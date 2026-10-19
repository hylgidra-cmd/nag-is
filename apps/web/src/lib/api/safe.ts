import { isApiError } from './errors';

/**
 * Next.js signals control flow by throwing: `redirect()`, `notFound()`, and
 * the dynamic-usage marker raised when `cookies()` is read during an attempted
 * static prerender. Those throws carry a `digest` and MUST propagate — if a
 * catch-all swallows them, Next never learns the route is dynamic and bakes a
 * sessionless page into the build output instead.
 *
 * This is the reason an earlier version of `safely()` produced a page whose
 * navigation was permanently signed out.
 */
function isFrameworkSignal(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest === 'string') {
    return (
      digest === 'DYNAMIC_SERVER_USAGE' ||
      digest.startsWith('NEXT_REDIRECT') ||
      digest === 'NEXT_NOT_FOUND' ||
      digest === 'NEXT_HTTP_ERROR_FALLBACK'
    );
  }

  // Older/other builds surface it by constructor name.
  const name = (error as { name?: unknown }).name;
  return name === 'DynamicServerError';
}

function describe(error: unknown): string {
  if (isApiError(error)) return `${error.status} ${error.code}`;
  return error instanceof Error ? error.message : String(error);
}

/**
 * Runs a server-side read and returns a fallback instead of throwing.
 *
 * For *supporting* data only — the category list in the navigation, a
 * secondary carousel. If the API is unreachable the page should still render
 * its primary content rather than collapse into an error boundary because a
 * nav dropdown could not be filled.
 *
 * Primary page data deliberately does NOT use this: a course detail page with
 * no course must show a real error, not an empty shell.
 */
export async function safely<T>(
  read: () => Promise<T>,
  fallback: T,
  context?: string,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;

    // Server-side only; never reaches the browser console.
    console.warn(`[nagis] optional read failed${context ? ` (${context})` : ''}: ${describe(error)}`);
    return fallback;
  }
}

/**
 * Like `safely`, but distinguishes "empty" from "failed" so a section can
 * show an error state rather than an empty state when appropriate.
 */
export async function settle<T>(
  read: () => Promise<T>,
): Promise<{ ok: true; data: T } | { ok: false; error: string; code: string }> {
  try {
    return { ok: true, data: await read() };
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;

    if (isApiError(error)) {
      return { ok: false, error: error.localisedMessage, code: error.code };
    }
    return { ok: false, error: describe(error), code: 'INTERNAL' };
  }
}

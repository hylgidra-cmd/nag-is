import { ApiError } from './errors';

/**
 * The single HTTP boundary between the web app and the NAG'IS API.
 *
 * Two execution contexts share it:
 *
 *  * **Browser** — requests go to the relative path `/api/v1/...`. Next.js
 *    rewrites that to the API process, so the request is same-origin and the
 *    HttpOnly session cookies ride along automatically. No token is ever read
 *    by JavaScript, and nothing is kept in localStorage or sessionStorage.
 *
 *  * **Server components / route handlers** — there is no origin to be
 *    relative to, so the absolute internal URL is used and the incoming
 *    request's `Cookie` header is forwarded explicitly.
 */

const API_PREFIX = '/api/v1';

const isServer = typeof window === 'undefined';

/**
 * Absolute base for server-side requests.
 *
 * In the browser this is the empty string, so requests stay relative and
 * same-origin. On the server there is no origin to be relative to, so an
 * absolute base is required.
 *
 * `API_INTERNAL_URL` is the one source of that base. On Vercel it is injected
 * at runtime by the `api` service binding declared in vercel.json, which
 * reaches the API over the internal network rather than back out through the
 * public edge.
 *
 * There is deliberately no localhost fallback in production. Defaulting to a
 * local address on a deployed server turns a missing variable into a confusing
 * connection error against a machine that is not there; throwing names the
 * actual problem.
 */
function baseUrl(): string {
  if (!isServer) return '';

  const configured = process.env['API_INTERNAL_URL'];
  // A binding supplies a URL base that may carry a trailing slash, which
  // would otherwise produce a double slash before the /api/v1 prefix.
  if (configured) return configured.replace(/\/+$/, '');

  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3001';

  throw new Error(
    'API_INTERNAL_URL is not set. Server-side requests need an absolute API ' +
      'base URL. On Vercel this is injected by the `api` service binding in ' +
      'vercel.json; elsewhere set it to the API origin.',
  );
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** JSON-serialisable request body. */
  body?: unknown;
  /** Query parameters. Undefined and null values are dropped. */
  query?: Record<string, string | number | boolean | string[] | undefined | null>;
  /**
   * Cookie header to forward. Required for authenticated server-side reads,
   * where there is no browser to attach cookies for us.
   */
  cookie?: string | undefined;
  /** Next.js fetch cache directive. Defaults to no caching. */
  cache?: RequestCache;
  /** Next.js revalidation window, in seconds. */
  revalidate?: number | false;
  /** Cache tags, so a mutation can invalidate exactly what it changed. */
  tags?: string[];
  signal?: AbortSignal;
}

function buildQuery(
  query: RequestOptions['query'],
): string {
  if (!query) return '';
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      // Repeated keys, which the API's Zod schemas accept as an array.
      for (const item of value) {
        if (item !== undefined && item !== null && item !== '') params.append(key, String(item));
      }
    } else {
      params.set(key, String(value));
    }
  }

  const serialised = params.toString();
  return serialised ? `?${serialised}` : '';
}

/**
 * Performs a request and returns the parsed body.
 *
 * Throws `ApiError` for any non-2xx response and for network failures, so
 * callers have exactly one error type to handle.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    cookie,
    cache,
    revalidate,
    tags,
    signal,
  } = options;

  const url = `${baseUrl()}${API_PREFIX}${path}${buildQuery(query)}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers['Cookie'] = cookie;

  const init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    method,
    headers,
    // Send cookies on same-origin browser requests.
    credentials: 'include',
  };

  if (body !== undefined) init.body = JSON.stringify(body);
  if (signal) init.signal = signal;

  if (cache) {
    init.cache = cache;
  } else if (revalidate === undefined) {
    // Default to fresh data: this is a logged-in product where a stale
    // catalog or progress number is worse than an extra request.
    init.cache = 'no-store';
  }

  if (revalidate !== undefined || tags) {
    init.next = {
      ...(revalidate !== undefined ? { revalidate } : {}),
      ...(tags ? { tags } : {}),
    };
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    throw ApiError.network(cause);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload: unknown = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    throw ApiError.fromBody(response.status, payload, path);
  }

  return payload as T;
}

/** Convenience wrappers. */
export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

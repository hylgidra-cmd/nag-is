import { cookies } from 'next/headers';
import type {
  AdminOverview,
  CategoryDto,
  CertificateDto,
  CertificateVerification,
  CourseDetail,
  CourseListItem,
  DashboardSummary,
  EnrollmentDto,
  InstructorSummary,
  LessonDetail,
  OrderDto,
  Paginated,
  PublicUser,
} from '@nagis/shared-types';
import { apiRequest, type RequestOptions } from './client';
import { ApiError } from './errors';

/**
 * Server-side API access for React Server Components.
 *
 * Server fetches have no browser to attach cookies, so the incoming request's
 * cookie header is forwarded explicitly. That is what lets a server-rendered
 * course page know whether the viewer is enrolled.
 */

/** Serialises the current request's cookies for forwarding to the API. */
export async function forwardedCookie(): Promise<string | undefined> {
  const store = await cookies();
  const all = store.getAll();
  if (all.length === 0) return undefined;
  return all.map(({ name, value }) => `${name}=${value}`).join('; ');
}

type ServerOptions = Omit<RequestOptions, 'cookie' | 'method' | 'body'>;

/** Authenticated server read: forwards the viewer's session. */
export async function serverGet<T>(path: string, options: ServerOptions = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET', cookie: await forwardedCookie() });
}

/**
 * Anonymous server read: deliberately omits cookies.
 *
 * Used for genuinely public, cacheable content so one visitor's session can
 * never influence a response that may be shared from the cache.
 */
export async function publicGet<T>(path: string, options: ServerOptions = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET' });
}

/**
 * Runs a server read and returns null on 401/403/404 instead of throwing.
 *
 * Lets a page degrade to its anonymous state rather than rendering an error
 * boundary when the viewer simply is not signed in.
 */
export async function tryServerGet<T>(
  path: string,
  options: ServerOptions = {},
): Promise<T | null> {
  try {
    return await serverGet<T>(path, options);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.isUnauthorized || error.isForbidden || error.isNotFound)
    ) {
      return null;
    }
    throw error;
  }
}

/* --------------------------------------------------------------------------
 * Typed endpoint helpers
 *
 * Every server-side read goes through one of these, so a route change is a
 * single-file edit rather than a grep across pages.
 * ----------------------------------------------------------------------- */

/** Public category list. Cached briefly: it changes rarely. */
export function getCategories(): Promise<CategoryDto[]> {
  return publicGet<CategoryDto[]>('/categories', { revalidate: 60, tags: ['categories'] });
}

export function getCategory(slug: string): Promise<CategoryDto> {
  return publicGet<CategoryDto>(`/categories/${encodeURIComponent(slug)}`, {
    revalidate: 60,
    tags: ['categories'],
  });
}

export function getFeaturedCourses(): Promise<CourseListItem[]> {
  return publicGet<CourseListItem[]>('/courses/featured', {
    revalidate: 60,
    tags: ['courses'],
  });
}

export function getNewestCourses(): Promise<CourseListItem[]> {
  return publicGet<CourseListItem[]>('/courses/newest', { revalidate: 60, tags: ['courses'] });
}

export function getFreeCourses(): Promise<CourseListItem[]> {
  return publicGet<CourseListItem[]>('/courses/free', { revalidate: 60, tags: ['courses'] });
}

export function getInstructors(): Promise<(InstructorSummary & { courseCount: number })[]> {
  return publicGet<(InstructorSummary & { courseCount: number })[]>('/courses/instructors', {
    revalidate: 300,
    tags: ['instructors'],
  });
}

export interface CourseSearchParams {
  q?: string | undefined;
  category?: string | undefined;
  level?: string[] | undefined;
  price?: string | undefined;
  sort?: string | undefined;
  page?: number | undefined;
  perPage?: number | undefined;
}

/**
 * Catalog search.
 *
 * Not cached: the result depends on the query string, and a stale page of
 * search results is more confusing than a fresh request is slow.
 */
export function searchCourses(params: CourseSearchParams): Promise<Paginated<CourseListItem>> {
  return publicGet<Paginated<CourseListItem>>('/courses', {
    query: {
      q: params.q,
      category: params.category,
      level: params.level,
      price: params.price,
      sort: params.sort,
      page: params.page,
      perPage: params.perPage,
    },
    cache: 'no-store',
  });
}

/**
 * Course detail.
 *
 * Forwards the session, because the API decides lesson accessibility and
 * enrollment state per viewer. Never cached for that reason.
 */
export function getCourse(slug: string): Promise<CourseDetail> {
  return serverGet<CourseDetail>(`/courses/${encodeURIComponent(slug)}`, { cache: 'no-store' });
}

/** The signed-in user, or null when there is no valid session. */
export function getCurrentUser(): Promise<PublicUser | null> {
  return tryServerGet<PublicUser>('/me', { cache: 'no-store' });
}

/* --------------------------------------------------------------------------
 * Student-scoped reads
 *
 * All of these forward the session cookie. The API derives the user from the
 * verified token, so none of them takes a user id — one student cannot read
 * another's data by changing a parameter.
 * ----------------------------------------------------------------------- */

/** Dashboard stats, activity series and recent events. */
export function getDashboard(): Promise<DashboardSummary> {
  return serverGet<DashboardSummary>('/me/dashboard', { cache: 'no-store' });
}

export function getMyCourses(params: {
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | undefined;
  page?: number | undefined;
  perPage?: number | undefined;
}): Promise<Paginated<EnrollmentDto>> {
  return serverGet<Paginated<EnrollmentDto>>('/me/courses', {
    query: {
      status: params.status,
      page: params.page,
      perPage: params.perPage,
    },
    cache: 'no-store',
  });
}

export function getSavedCourses(): Promise<CourseListItem[]> {
  return serverGet<CourseListItem[]>('/me/saved-courses', { cache: 'no-store' });
}

export function getMyCertificates(): Promise<CertificateDto[]> {
  return serverGet<CertificateDto[]>('/me/certificates', { cache: 'no-store' });
}

/**
 * Lesson content.
 *
 * The API enforces access and throws 403 for a locked lesson, so the caller
 * must handle that rather than assuming success.
 */
export function getLesson(lessonId: string): Promise<LessonDetail> {
  return serverGet<LessonDetail>(`/lessons/${encodeURIComponent(lessonId)}`, {
    cache: 'no-store',
  });
}

/**
 * Public certificate verification.
 *
 * Deliberately anonymous: the verifier is usually not the holder, and the
 * endpoint returns `{ valid: false }` rather than an error for unknown codes.
 */
export function verifyCertificate(code: string): Promise<CertificateVerification> {
  return publicGet<CertificateVerification>(
    `/certificates/verify/${encodeURIComponent(code)}`,
    { cache: 'no-store' },
  );
}

/* --------------------------------------------------------------------------
 * Admin reads
 *
 * These hit /admin/* endpoints, which the API restricts to the ADMIN role via
 * RolesGuard. A non-admin session receives 403 from the server — the admin UI
 * hiding a link is presentation, never the access control.
 * ----------------------------------------------------------------------- */

export function getAdminOverview(): Promise<AdminOverview> {
  return serverGet<AdminOverview>('/admin/overview', { cache: 'no-store' });
}

/** Course list including drafts and archived courses. */
export function getAdminCourses(params: {
  q?: string | undefined;
  status?: string | undefined;
  categoryId?: string | undefined;
  page?: number | undefined;
  perPage?: number | undefined;
}): Promise<
  Paginated<CourseListItem & { status: string; updatedAt: string }>
> {
  return serverGet<Paginated<CourseListItem & { status: string; updatedAt: string }>>(
    '/admin/courses',
    {
      query: {
        q: params.q,
        status: params.status,
        categoryId: params.categoryId,
        page: params.page,
        perPage: params.perPage,
      },
      cache: 'no-store',
    },
  );
}

/** Includes inactive categories, unlike the public list. */
export function getAdminCategories(): Promise<CategoryDto[]> {
  return serverGet<CategoryDto[]>('/admin/categories', { cache: 'no-store' });
}

export interface AdminUserRow extends PublicUser {
  isActive: boolean;
  enrollmentCount: number;
  lastLoginAt: string | null;
}

export function getAdminUsers(params: {
  q?: string | undefined;
  role?: string | undefined;
  page?: number | undefined;
  perPage?: number | undefined;
}): Promise<Paginated<AdminUserRow>> {
  return serverGet<Paginated<AdminUserRow>>('/admin/users', {
    query: { q: params.q, role: params.role, page: params.page, perPage: params.perPage },
    cache: 'no-store',
  });
}

export interface AdminOrderRow extends OrderDto {
  customerName: string;
  customerEmail: string;
}

export function getAdminOrders(params: {
  status?: string | undefined;
  page?: number | undefined;
  perPage?: number | undefined;
}): Promise<Paginated<AdminOrderRow>> {
  return serverGet<Paginated<AdminOrderRow>>('/admin/orders', {
    query: { status: params.status, page: params.page, perPage: params.perPage },
    cache: 'no-store',
  });
}

export function getAdminCourse(id: string): Promise<CourseDetail> {
  return serverGet<CourseDetail>(`/admin/courses/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });
}

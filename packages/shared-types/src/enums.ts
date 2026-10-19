/**
 * Domain enums shared between the NestJS API and the Next.js web app.
 *
 * These string unions mirror the Prisma enums one-to-one. Keeping them here
 * (instead of importing @prisma/client in the browser bundle) means the web
 * app never pulls the Prisma runtime into client code.
 */

export const USER_ROLES = ['STUDENT', 'INSTRUCTOR', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const COURSE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const COURSE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const LESSON_TYPES = ['VIDEO', 'ARTICLE', 'QUIZ'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export const ENROLLMENT_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ORDER_STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'CREATED',
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ['DEV', 'PAYME', 'CLICK'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PROGRESS_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const COURSE_SORT_OPTIONS = [
  'newest',
  'oldest',
  'price_asc',
  'price_desc',
  'rating',
  'popular',
  'title',
] as const;
export type CourseSort = (typeof COURSE_SORT_OPTIONS)[number];

export const COURSE_PRICE_FILTERS = ['all', 'free', 'paid'] as const;
export type CoursePriceFilter = (typeof COURSE_PRICE_FILTERS)[number];

import { z } from 'zod';
import {
  COURSE_LEVELS,
  COURSE_PRICE_FILTERS,
  COURSE_SORT_OPTIONS,
  COURSE_STATUSES,
  LESSON_TYPES,
} from '@nagis/shared-types';

export const DEFAULT_PER_PAGE = 12;
export const MAX_PER_PAGE = 48;

/**
 * Query-string integers. `.catch()` means a hand-edited URL such as
 * `?page=abc` falls back to the default instead of returning a 400 on a page
 * the user can still be shown.
 */
const pageParam = z.coerce.number().int().min(1).max(10_000).catch(1);
const perPageParam = z.coerce.number().int().min(1).max(MAX_PER_PAGE).catch(DEFAULT_PER_PAGE);

export const paginationSchema = z.object({
  page: pageParam,
  perPage: perPageParam,
});
export type PaginationInput = z.infer<typeof paginationSchema>;

export const slugSchema = z
  .string()
  .trim()
  .min(2, 'validation.slug.tooShort')
  .max(120, 'validation.tooLong')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'validation.slug.invalid');

export const courseQuerySchema = z.object({
  page: pageParam,
  perPage: perPageParam,
  /** Free-text search across course title and summary. */
  q: z.string().trim().max(120).optional(),
  /** Category slug. */
  category: z.string().trim().max(120).optional(),
  /** Accepts `?level=BEGINNER` once or repeated. */
  level: z
    .union([z.enum(COURSE_LEVELS), z.array(z.enum(COURSE_LEVELS))])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return Array.isArray(value) ? value : [value];
    }),
  price: z.enum(COURSE_PRICE_FILTERS).catch('all'),
  sort: z.enum(COURSE_SORT_OPTIONS).catch('newest'),
  instructorId: z.uuid().optional(),
});
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;

export const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .int('validation.rating.range')
    .min(1, 'validation.rating.range')
    .max(5, 'validation.rating.range'),
  comment: z.string().trim().max(2000, 'validation.tooLong').nullish(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

/* --------------------------------------------------------------------------
 * Admin: categories
 * -------------------------------------------------------------------------- */

const hexColor = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'validation.color.invalid');

export const categoryUpsertSchema = z.object({
  name: z.string().trim().min(2, 'validation.tooShort').max(80, 'validation.tooLong'),
  slug: slugSchema,
  description: z.string().trim().max(500, 'validation.tooLong').nullish(),
  /** Lucide icon name, e.g. "Code2". Resolved to a component on the client. */
  icon: z.string().trim().max(60).nullish(),
  accent: hexColor.nullish(),
  position: z.coerce.number().int().min(0).max(999).default(0),
});
export type CategoryUpsertInput = z.infer<typeof categoryUpsertSchema>;

export const categoryUpdateSchema = categoryUpsertSchema.partial();
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

/* --------------------------------------------------------------------------
 * Admin: courses
 * -------------------------------------------------------------------------- */

const bulletList = z
  .array(z.string().trim().min(1).max(300))
  .max(20, 'validation.list.tooMany')
  .default([]);

/** Integer UZS so`m. Never a float — see @nagis/shared-types/money. */
const priceUzsSchema = z.coerce
  .number()
  .int('validation.price.integer')
  .min(0, 'validation.price.min')
  .max(500_000_000, 'validation.price.max');

export const courseCreateSchema = z.object({
  title: z.string().trim().min(3, 'validation.tooShort').max(160, 'validation.tooLong'),
  slug: slugSchema,
  summary: z.string().trim().min(10, 'validation.tooShort').max(300, 'validation.tooLong'),
  description: z.string().trim().min(20, 'validation.tooShort').max(20_000, 'validation.tooLong'),
  categoryId: z.uuid('validation.uuid.invalid'),
  /** Optional: defaults to the acting admin/instructor on the server. */
  instructorId: z.uuid('validation.uuid.invalid').optional(),
  level: z.enum(COURSE_LEVELS).default('BEGINNER'),
  status: z.enum(COURSE_STATUSES).default('DRAFT'),
  priceUzs: priceUzsSchema,
  comparePriceUzs: priceUzsSchema.nullish(),
  thumbnailUrl: z.string().trim().max(2000).nullish(),
  promoVideoUrl: z.string().trim().max(2000).nullish(),
  language: z.string().trim().min(2).max(10).default('kaa'),
  objectives: bulletList,
  prerequisites: bulletList,
  targetAudience: bulletList,
});
export type CourseCreateInput = z.infer<typeof courseCreateSchema>;

export const courseUpdateSchema = courseCreateSchema.partial();
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;

export const adminCourseQuerySchema = z.object({
  page: pageParam,
  perPage: perPageParam,
  q: z.string().trim().max(120).optional(),
  status: z.enum(COURSE_STATUSES).optional(),
  categoryId: z.uuid().optional(),
});
export type AdminCourseQueryInput = z.infer<typeof adminCourseQuerySchema>;

/* --------------------------------------------------------------------------
 * Admin: modules & lessons
 * -------------------------------------------------------------------------- */

export const moduleCreateSchema = z.object({
  courseId: z.uuid('validation.uuid.invalid'),
  title: z.string().trim().min(2, 'validation.tooShort').max(160, 'validation.tooLong'),
  description: z.string().trim().max(1000, 'validation.tooLong').nullish(),
  position: z.coerce.number().int().min(0).max(999).optional(),
});
export type ModuleCreateInput = z.infer<typeof moduleCreateSchema>;

export const moduleUpdateSchema = moduleCreateSchema.omit({ courseId: true }).partial();
export type ModuleUpdateInput = z.infer<typeof moduleUpdateSchema>;

export const lessonCreateSchema = z.object({
  moduleId: z.uuid('validation.uuid.invalid'),
  title: z.string().trim().min(2, 'validation.tooShort').max(160, 'validation.tooLong'),
  slug: slugSchema,
  type: z.enum(LESSON_TYPES).default('VIDEO'),
  description: z.string().trim().max(2000, 'validation.tooLong').nullish(),
  /** Markdown body for ARTICLE lessons, or supporting notes for VIDEO. */
  content: z.string().trim().max(100_000, 'validation.tooLong').nullish(),
  /**
   * Provider-side video reference. With VIDEO_DRIVER=none this may be a plain
   * public URL; with a real provider it is the provider's asset id. It is
   * never sent to a client that lacks access to the lesson.
   */
  videoRef: z.string().trim().max(2000).nullish(),
  durationMinutes: z.coerce.number().int().min(0, 'validation.duration.min').max(1000).default(0),
  position: z.coerce.number().int().min(0).max(999).optional(),
  isPreview: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});
export type LessonCreateInput = z.infer<typeof lessonCreateSchema>;

export const lessonUpdateSchema = lessonCreateSchema.omit({ moduleId: true }).partial();
export type LessonUpdateInput = z.infer<typeof lessonUpdateSchema>;

/** Reordering from the admin curriculum editor. */
export const reorderSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
});
export type ReorderInput = z.infer<typeof reorderSchema>;

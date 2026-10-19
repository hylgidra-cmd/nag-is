import type { Paginated } from '@nagis/shared-types';

export interface PageRequest {
  page: number;
  perPage: number;
}

/** Converts a 1-based page request into Prisma's skip/take. */
export function toSkipTake({ page, perPage }: PageRequest): { skip: number; take: number } {
  return { skip: (page - 1) * perPage, take: perPage };
}

/** Wraps a page of rows in the standard list envelope. */
export function paginate<T>(items: T[], total: number, request: PageRequest): Paginated<T> {
  const totalPages = request.perPage > 0 ? Math.ceil(total / request.perPage) : 0;
  return {
    items,
    meta: {
      page: request.page,
      perPage: request.perPage,
      total,
      totalPages,
      hasNext: request.page < totalPages,
      hasPrev: request.page > 1,
    },
  };
}

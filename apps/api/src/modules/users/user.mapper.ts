import type { InstructorSummary, PublicUser } from '@nagis/shared-types';
import type { User } from '@prisma/client';

/**
 * Projects a User row onto the public DTO.
 *
 * This exists so `passwordHash` can never reach a response by accident: every
 * route returns the mapper's output, and the mapper names its fields
 * explicitly rather than spreading the row.
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    headline: user.headline,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  };
}

export type InstructorRow = Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'headline' | 'bio'>;

export function toInstructorSummary(user: InstructorRow): InstructorSummary {
  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    headline: user.headline,
    bio: user.bio,
  };
}

/** Fields to select when embedding an instructor in a course payload. */
export const instructorSelect = {
  id: true,
  fullName: true,
  avatarUrl: true,
  headline: true,
  bio: true,
} as const;

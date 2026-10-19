import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  CertificateDto,
  CourseListItem,
  DashboardSummary,
  EnrollmentDto,
  Paginated,
} from '@nagis/shared-types';
import { z } from 'zod';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { zodQuery } from '../../common/pipes/zod-validation.pipe';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CertificatesService } from '../certificates/certificates.service';
import { DashboardService } from './dashboard.service';

/** Query for the student's own course list. */
const myCoursesQuery = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  perPage: z.coerce.number().int().min(1).max(48).catch(12),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});
type MyCoursesQuery = z.infer<typeof myCoursesQuery>;

/**
 * Everything scoped to the signed-in student.
 *
 * The whole controller is private: there is no `@Public()` here, so the
 * globally registered access-token guard rejects anonymous callers before any
 * handler runs. Every method derives the user from the verified token, never
 * from a path or body parameter, so one student cannot read another's data by
 * changing an id.
 */
@ApiTags('me')
@Controller({ path: 'me', version: '1' })
export class MeController {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly enrollments: EnrollmentsService,
    private readonly certificates: CertificatesService,
  ) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Student dashboard summary',
    description:
      'Stats, a 30-day activity series, category breakdown and recent events — all computed from real progress rows.',
  })
  async dashboardSummary(@CurrentUser() user: AuthenticatedUser): Promise<DashboardSummary> {
    return this.dashboard.getSummary(user.id);
  }

  @Get('courses')
  @ApiOperation({ summary: 'Courses the student is enrolled in' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  async myCourses(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodQuery(myCoursesQuery)) query: MyCoursesQuery,
  ): Promise<Paginated<EnrollmentDto>> {
    return this.enrollments.listMine(user.id, query);
  }

  @Get('saved-courses')
  @ApiOperation({ summary: 'Courses the student bookmarked' })
  async savedCourses(@CurrentUser() user: AuthenticatedUser): Promise<CourseListItem[]> {
    return this.enrollments.listSaved(user.id);
  }

  @Post('saved-courses/:courseId')
  @ApiOperation({ summary: 'Bookmark a course' })
  async saveCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ saved: true }> {
    await this.enrollments.save(user.id, courseId);
    return { saved: true };
  }

  @Delete('saved-courses/:courseId')
  @ApiOperation({ summary: 'Remove a bookmark' })
  async unsaveCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ saved: false }> {
    await this.enrollments.unsave(user.id, courseId);
    return { saved: false };
  }

  @Get('certificates')
  @ApiOperation({ summary: 'Certificates earned by the student' })
  async myCertificates(@CurrentUser() user: AuthenticatedUser): Promise<CertificateDto[]> {
    return this.certificates.listMine(user.id);
  }

  @Get('certificates/:code')
  @ApiOperation({ summary: 'One of the student own certificates' })
  async myCertificate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('code') code: string,
  ): Promise<CertificateDto> {
    return this.certificates.getMine(user.id, code.toUpperCase());
  }
}

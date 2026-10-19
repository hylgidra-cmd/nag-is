import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { CourseDetail, CourseListItem, Paginated } from '@nagis/shared-types';
import { courseQuerySchema, type CourseQueryInput } from '@nagis/shared-validation';
import { MaybeUser, OptionalAuth, Public } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { zodQuery } from '../../common/pipes/zod-validation.pipe';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@Controller({ path: 'courses', version: '1' })
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search the published course catalog' })
  @ApiQuery({ name: 'q', required: false, description: 'Free-text search over title and summary' })
  @ApiQuery({ name: 'category', required: false, description: 'Category slug' })
  @ApiQuery({
    name: 'level',
    required: false,
    isArray: true,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
  })
  @ApiQuery({ name: 'price', required: false, enum: ['all', 'free', 'paid'] })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['newest', 'oldest', 'price_asc', 'price_desc', 'rating', 'popular', 'title'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  async list(
    @Query(zodQuery(courseQuerySchema)) query: CourseQueryInput,
  ): Promise<Paginated<CourseListItem>> {
    return this.courses.list(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Most-enrolled published courses, for the landing page' })
  async featured(): Promise<CourseListItem[]> {
    return this.courses.featured();
  }

  @Public()
  @Get('newest')
  @ApiOperation({ summary: 'Recently published courses' })
  async newest(): Promise<CourseListItem[]> {
    return this.courses.newest();
  }

  @Public()
  @Get('free')
  @ApiOperation({ summary: 'Published courses that cost nothing' })
  async free(): Promise<CourseListItem[]> {
    return this.courses.free();
  }

  @Public()
  @Get('instructors')
  @ApiOperation({ summary: 'Instructors who have at least one published course' })
  async instructors() {
    return this.courses.listInstructors();
  }

  /**
   * Declared after the fixed segments above so "featured" and friends are not
   * swallowed by the :slug parameter.
   */
  @OptionalAuth()
  @Get(':slug')
  @ApiOperation({
    summary: 'Full course detail',
    description:
      'Public, but lesson accessibility and enrollment state are resolved for the caller when a valid session is present. Video references are never included here.',
  })
  async bySlug(
    @Param('slug') slug: string,
    @MaybeUser() viewer: AuthenticatedUser | undefined,
  ): Promise<CourseDetail> {
    return this.courses.getBySlug(slug, viewer);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { AdminOverview, CategoryDto, CourseDetail, PublicUser } from '@nagis/shared-types';
import {
  adminCourseQuerySchema,
  adminUpdateUserSchema,
  adminUserQuerySchema,
  categoryUpdateSchema,
  categoryUpsertSchema,
  courseCreateSchema,
  courseUpdateSchema,
  lessonCreateSchema,
  lessonUpdateSchema,
  moduleCreateSchema,
  moduleUpdateSchema,
  reorderSchema,
  type AdminCourseQueryInput,
  type AdminUpdateUserInput,
  type AdminUserQueryInput,
  type CategoryUpdateInput,
  type CategoryUpsertInput,
  type CourseCreateInput,
  type CourseUpdateInput,
  type LessonCreateInput,
  type LessonUpdateInput,
  type ModuleCreateInput,
  type ModuleUpdateInput,
  type ReorderInput,
} from '@nagis/shared-validation';
import { CurrentUser, RequestContext, Roles } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { zodBody, zodQuery } from '../../common/pipes/zod-validation.pipe';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { AdminService } from './admin.service';

const orderQuery = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  perPage: z.coerce.number().int().min(1).max(48).catch(20),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
});
type OrderQuery = z.infer<typeof orderQuery>;

/**
 * Administrative API.
 *
 * `@Roles('ADMIN')` is applied to the whole controller, so RolesGuard refuses
 * every route here for any other role before a handler runs. This — not the
 * absence of a link in the UI — is what protects these endpoints: a student
 * calling them directly with a valid session receives 403.
 *
 * Every mutation writes an audit entry naming the acting administrator.
 */
@ApiTags('admin')
@Roles('ADMIN')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly categories: CategoriesService,
    private readonly users: UsersService,
  ) {}

  /* ---------------------------------------------------------------- */

  @Get('overview')
  @ApiOperation({ summary: 'Platform totals and 30-day trends' })
  async overview(): Promise<AdminOverview> {
    return this.admin.overview();
  }

  /* ----------------------------- courses -------------------------- */

  @Get('courses')
  @ApiOperation({ summary: 'All courses, including drafts' })
  async listCourses(@Query(zodQuery(adminCourseQuerySchema)) query: AdminCourseQueryInput) {
    return this.admin.listCourses(query);
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'One course with its full curriculum, for editing' })
  async getCourse(@Param('id', ParseUUIDPipe) id: string): Promise<CourseDetail> {
    return this.admin.getCourseForAdmin(id);
  }

  @Post('courses')
  @ApiOperation({ summary: 'Create a course' })
  async createCourse(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Body(zodBody(courseCreateSchema)) input: CourseCreateInput,
  ): Promise<CourseDetail> {
    return this.admin.createCourse({ id: user.id, ...meta }, input);
  }

  @Patch('courses/:id')
  @ApiOperation({ summary: 'Update a course, including publish/archive' })
  async updateCourse(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zodBody(courseUpdateSchema)) input: CourseUpdateInput,
  ): Promise<CourseDetail> {
    return this.admin.updateCourse({ id: user.id, ...meta }, id, input);
  }

  @Delete('courses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a course',
    description:
      'Refused with 409 once the course has enrollments, order items or certificates — archive it instead, so receipts and student access survive.',
  })
  async deleteCourse(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.admin.deleteCourse({ id: user.id, ...meta }, id);
  }

  /* ----------------------------- modules -------------------------- */

  @Post('modules')
  @ApiOperation({ summary: 'Add a module to a course' })
  async createModule(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Body(zodBody(moduleCreateSchema)) input: ModuleCreateInput,
  ) {
    return this.admin.createModule({ id: user.id, ...meta }, input);
  }

  @Patch('modules/:id')
  @ApiOperation({ summary: 'Update a module' })
  async updateModule(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zodBody(moduleUpdateSchema)) input: ModuleUpdateInput,
  ) {
    return this.admin.updateModule({ id: user.id, ...meta }, id, input);
  }

  @Delete('modules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a module',
    description: 'Cascades to its lessons and their progress records.',
  })
  async deleteModule(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.admin.deleteModule({ id: user.id, ...meta }, id);
  }

  @Post('courses/:id/modules/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reorder a course modules' })
  async reorderModules(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zodBody(reorderSchema)) input: ReorderInput,
  ): Promise<void> {
    await this.admin.reorderModules({ id: user.id, ...meta }, id, input);
  }

  /* ----------------------------- lessons -------------------------- */

  @Post('lessons')
  @ApiOperation({ summary: 'Add a lesson to a module' })
  async createLesson(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Body(zodBody(lessonCreateSchema)) input: LessonCreateInput,
  ) {
    return this.admin.createLesson({ id: user.id, ...meta }, input);
  }

  @Patch('lessons/:id')
  @ApiOperation({ summary: 'Update a lesson' })
  async updateLesson(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zodBody(lessonUpdateSchema)) input: LessonUpdateInput,
  ) {
    return this.admin.updateLesson({ id: user.id, ...meta }, id, input);
  }

  @Delete('lessons/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lesson' })
  async deleteLesson(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.admin.deleteLesson({ id: user.id, ...meta }, id);
  }

  @Post('modules/:id/lessons/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reorder a module lessons' })
  async reorderLessons(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zodBody(reorderSchema)) input: ReorderInput,
  ): Promise<void> {
    await this.admin.reorderLessons({ id: user.id, ...meta }, id, input);
  }

  /* --------------------------- categories ------------------------- */

  @Get('categories')
  @ApiOperation({ summary: 'All categories, including inactive' })
  async listCategories(): Promise<CategoryDto[]> {
    return this.categories.listForAdmin();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  async createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Body(zodBody(categoryUpsertSchema)) input: CategoryUpsertInput,
  ): Promise<CategoryDto> {
    return this.categories.create(user.id, input, meta);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  async updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zodBody(categoryUpdateSchema)) input: CategoryUpdateInput,
  ): Promise<CategoryDto> {
    return this.categories.update(user.id, id, input, meta);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a category',
    description: 'Refused with 409 while any course still references it.',
  })
  async deleteCategory(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.categories.remove(user.id, id, meta);
  }

  /* ------------------------------ users --------------------------- */

  @Get('users')
  @ApiOperation({ summary: 'Search platform users' })
  async listUsers(@Query(zodQuery(adminUserQuerySchema)) query: AdminUserQueryInput) {
    return this.users.listForAdmin(query);
  }

  @Patch('users/:id')
  @ApiOperation({
    summary: 'Change a user role or active state',
    description:
      'An administrator cannot demote or disable their own account, and the last active administrator cannot be removed.',
  })
  async updateUser(
    @CurrentUser() user: AuthenticatedUser,
    @RequestContext() meta: { ip?: string; userAgent?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zodBody(adminUpdateUserSchema)) input: AdminUpdateUserInput,
  ): Promise<PublicUser> {
    return this.users.updateByAdmin(user.id, id, input, meta);
  }

  /* ------------------------------ orders -------------------------- */

  @Get('orders')
  @ApiOperation({ summary: 'All orders with their payment state' })
  async listOrders(@Query(zodQuery(orderQuery)) query: OrderQuery) {
    return this.admin.listOrders(query);
  }
}

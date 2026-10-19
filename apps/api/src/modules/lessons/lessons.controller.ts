import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { LessonDetail } from '@nagis/shared-types';
import { lessonProgressSchema, type LessonProgressInput } from '@nagis/shared-validation';
import { CurrentUser, MaybeUser, OptionalAuth } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { zodBody } from '../../common/pipes/zod-validation.pipe';
import { LessonsService } from './lessons.service';

@ApiTags('lessons')
@Controller({ path: 'lessons', version: '1' })
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  /**
   * Optional auth: preview lessons are open to anyone, so an anonymous
   * request is valid. The service still decides access per lesson, and
   * returns 403 for anything that is not a preview.
   */
  @OptionalAuth()
  @Get(':id')
  @ApiOperation({
    summary: 'Lesson content',
    description:
      'Access is enforced server-side. Preview lessons are public; everything else requires a live enrollment. The stored video reference is never returned — only a resolved, short-lived playback descriptor (null when no provider is configured).',
  })
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
    @MaybeUser() user: AuthenticatedUser | undefined,
  ): Promise<LessonDetail> {
    return this.lessons.getDetail(id, user);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a lesson complete' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessons.complete(id, user);
  }

  @Delete(':id/complete')
  @ApiOperation({ summary: 'Clear a lesson completion' })
  async uncomplete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessons.uncomplete(id, user);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Save video position and private notes' })
  async saveProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(lessonProgressSchema)) input: LessonProgressInput,
  ): Promise<{ saved: true }> {
    await this.lessons.saveProgress(id, user, input);
    return { saved: true };
  }
}

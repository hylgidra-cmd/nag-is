import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { EnrollmentDto } from '@nagis/shared-types';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('courses')
@Controller({ path: 'courses', version: '1' })
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  /**
   * Enrols the signed-in student.
   *
   * Free courses enrol immediately. For a paid course the server checks for a
   * PAID order containing it and answers 402 otherwise, so this endpoint
   * cannot be used to bypass payment.
   */
  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enrol in a course' })
  @ApiResponse({ status: 201, description: 'Enrolled' })
  @ApiResponse({ status: 402, description: 'Paid course with no completed payment' })
  @ApiResponse({ status: 409, description: 'Already enrolled' })
  async enroll(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EnrollmentDto> {
    return this.enrollments.enroll(user.id, id);
  }
}

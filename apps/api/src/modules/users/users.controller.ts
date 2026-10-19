import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { PublicUser } from '@nagis/shared-types';
import { updateProfileSchema, type UpdateProfileInput } from '@nagis/shared-validation';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { zodBody } from '../../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';

@ApiTags('me')
@Controller({ path: 'me', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'The signed-in user profile' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.users.getPublicById(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the signed-in user profile' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(updateProfileSchema)) input: UpdateProfileInput,
  ): Promise<PublicUser> {
    return this.users.updateProfile(user.id, input);
  }
}

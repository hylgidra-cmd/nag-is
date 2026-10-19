import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CategoryDto } from '@nagis/shared-types';
import { Public } from '../../common/decorators';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Active categories with their published course counts' })
  async list(): Promise<CategoryDto[]> {
    return this.categories.listPublic();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'A single category by slug' })
  async bySlug(@Param('slug') slug: string): Promise<CategoryDto> {
    return this.categories.getBySlug(slug);
  }
}

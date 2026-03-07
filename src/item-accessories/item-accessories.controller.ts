import { Controller, Get, Param } from '@nestjs/common';
import { ItemAccessoriesService } from './item-accessories.service';

@Controller('item-accessories')
export class ItemAccessoriesController {
  constructor(
    private readonly itemAccessoriesService: ItemAccessoriesService,
  ) {}

  @Get(':itemId/find-by-item/')
  async findByItem(@Param('itemId') itemId: string) {
    const accessories = await this.itemAccessoriesService.findByItem(itemId);

    console.log('accesorios', accessories);

    return {
      success: true,
      data: accessories,
    };
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { ItemUnitUsageLogsService } from './item_unit_usage_logs.service';

@Controller('item-unit-usage-logs')
export class ItemUnitUsageLogsController {
  constructor(
    private readonly itemUnitUsageLogsService: ItemUnitUsageLogsService,
  ) {}

  @Get(':unitId/item-unit')
  async getByItemUnit(@Param('unitId') unitId: string) {
    const usageLogs =
      await this.itemUnitUsageLogsService.findByItemUnit(unitId);

    return {
      success: true,
      data: usageLogs,
    };
  }
}

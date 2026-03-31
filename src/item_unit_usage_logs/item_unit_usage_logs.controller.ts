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

  @Get(':unitId/last-active')
  async getLastActiveByItemUnit(@Param('unitId') unitId: string) {
    const usageLog =
      await this.itemUnitUsageLogsService.findLastActiveByItemUnit(unitId);

    console.log('Last active usage log for unit', unitId, usageLog);

    return usageLog;
  }
}

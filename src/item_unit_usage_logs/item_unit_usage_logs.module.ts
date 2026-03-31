import { Module } from '@nestjs/common';
import { ItemUnitUsageLogsService } from './item_unit_usage_logs.service';
import { ItemUnitUsageLogsController } from './item_unit_usage_logs.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ItemUnitsService } from 'src/item-units/item-units.service';
import { ItemsService } from 'src/items/items.service';
import { ItemUnitsModule } from 'src/item-units/item-units.module';
import { ItemsModule } from 'src/items/items.module';

@Module({
  providers: [ItemUnitUsageLogsService],
  controllers: [ItemUnitUsageLogsController],
  imports: [DatabaseModule, ItemUnitsModule, ItemsModule],
  exports: [ItemUnitUsageLogsService],
})
export class ItemUnitUsageLogsModule {}

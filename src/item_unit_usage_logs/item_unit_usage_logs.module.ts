import { Module } from '@nestjs/common';
import { ItemUnitUsageLogsService } from './item_unit_usage_logs.service';
import { ItemUnitUsageLogsController } from './item_unit_usage_logs.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  providers: [ItemUnitUsageLogsService],
  controllers: [ItemUnitUsageLogsController],
  imports: [DatabaseModule],
  exports: [ItemUnitUsageLogsService],
})
export class ItemUnitUsageLogsModule {}

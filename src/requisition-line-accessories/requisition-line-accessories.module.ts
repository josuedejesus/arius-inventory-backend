import { Module } from '@nestjs/common';
import { RequisitionLineAccessoriesService } from './requisition-line-accessories.service';
import { RequisitionLineAccessoriesController } from './requisition-line-accessories.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ItemUnitsModule } from 'src/item-units/item-units.module';

@Module({
  providers: [RequisitionLineAccessoriesService],
  controllers: [RequisitionLineAccessoriesController],
  imports: [DatabaseModule, ItemUnitsModule]
})
export class RequisitionLineAccessoriesModule {}

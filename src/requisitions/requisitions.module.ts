import { Module } from '@nestjs/common';
import { RequisitionsController } from './requisitions.controller';
import { RequisitionsService } from './requisitions.service';
import { DatabaseModule } from 'src/database/database.module';
import { LocationsModule } from 'src/locations/locations.module';
import { PersonsModule } from 'src/persons/persons.module';
import { UsersModule } from 'src/users/users.module';
import { RequisitionLinesModule } from 'src/requisition-lines/requisition-lines.module';
import { StockMovesModule } from 'src/stock_moves/stock_moves.module';
import { ItemUnitsModule } from 'src/item-units/item-units.module';
import { EventsModule } from 'src/events/events.module';
import { ItemUnitUsageLogsModule } from 'src/item_unit_usage_logs/item_unit_usage_logs.module';
import { RequisitionHandlerFactory } from './handlers/handler.factory';
import { AdjustmentHandler } from './handlers/adjustment.handler';
import { InternalTransferHandler } from './handlers/internal-transfer.handler';
import { PurchaseReceiptHandler } from './handlers/purchase-receipt';
import { RentHandler } from './handlers/rent.handler';
import { ReturnHandler } from './handlers/return.handler';

@Module({
  controllers: [RequisitionsController],
  providers: [
    RequisitionsService,
    RequisitionHandlerFactory,
    AdjustmentHandler,
    InternalTransferHandler,
    PurchaseReceiptHandler,
    RentHandler,
    ReturnHandler,
  ],
  imports: [
    DatabaseModule,
    LocationsModule,
    PersonsModule,
    UsersModule,
    RequisitionLinesModule,
    StockMovesModule,
    ItemUnitsModule,
    EventsModule,
    ItemUnitUsageLogsModule,
    LocationsModule
  ],
  exports: [RequisitionsService],
})
export class RequisitionsModule {}

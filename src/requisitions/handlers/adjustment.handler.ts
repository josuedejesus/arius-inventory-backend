import { Injectable } from '@nestjs/common';
import { RequisitionHandler } from './requisition-handler.interface';
import { ItemUnitsService } from '../../item-units/item-units.service';
import { ItemUnitUsageLogsService } from 'src/item_unit_usage_logs/item_unit_usage_logs.service';
import { RequisitionsService } from '../requisitions.service';
import { RequisitionLinesService } from 'src/requisition-lines/requisition-lines.service';
import { LOCATIONS } from '../constants/locations';
import { StockMovesService } from 'src/stock_moves/stock_moves.service';

@Injectable()
export class AdjustmentHandler implements RequisitionHandler {
  constructor(private readonly itemUnitsService: ItemUnitsService,
    private readonly requisitionLinesService: RequisitionLinesService,
    private readonly stockMovesService: StockMovesService,
    private readonly itemUnitUsageLogsService: ItemUnitUsageLogsService
  ) {}

  async approve(requisition: any, personId: string, trx: any) {
    const lines = await trx('requisition_lines').where({
      requisition_id: requisition.id,
    });

    const ids = lines.map((l: any) => l.item_unit_id);

    await this.itemUnitsService.updateMany(
      ids,
      { status: 'RESERVED', updated_at: new Date() },
      trx,
    );
  }

  async execute(requisition: any, personId: string, trx: any) {

    const lines = await this.requisitionLinesService.findByRequisitionId(
      requisition.id,
    );

    const destination = LOCATIONS.MAIN;

    // 🔥 MOVEMENTS
    const movements = lines.map((l: any) => ({
      requisition_id: requisition.id,
      item_id: l.item_id,
      item_unit_id: l.item_unit_id,
      quantity: l.quantity,
      source_location_id: l.location_id,
      destination_location_id: destination,
      executed_by: personId,
      executed_at: new Date(),
    }));

    await this.stockMovesService.createMany(movements, trx);

    // 🔥 UPDATE ITEMS
    const ids = lines.map((l: any) => l.item_unit_id);

    await this.itemUnitsService.updateMany(
      ids,
      {
        status: 'IN_TRANSIT',
        location_id: destination,
        updated_at: new Date(),
      },
      trx,
    );

    // 🔥 USAGE LOGS
    const logPayload = ids.map((id: number) => ({
      item_unit_id: id,
      requisition_id: requisition.id,
      start_at: new Date(),
      created_at: new Date(),
    }));

    await this.itemUnitUsageLogsService.createMany(logPayload, trx);
  }
}

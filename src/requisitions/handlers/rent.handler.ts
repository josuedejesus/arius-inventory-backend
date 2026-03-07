import {
  Injectable,
  ConflictException,
} from '@nestjs/common';

import { RequisitionHandler } from './requisition-handler.interface';
import { ItemUnitsService } from '../../item-units/item-units.service';
import { RequisitionLinesService } from 'src/requisition-lines/requisition-lines.service';
import { StockMovesService } from 'src/stock_moves/stock_moves.service';
import { ItemUnitUsageLogsService } from 'src/item_unit_usage_logs/item_unit_usage_logs.service';
import { LOCATIONS } from '../constants/locations';


@Injectable()
export class RentHandler implements RequisitionHandler {
  constructor(
    private readonly requisitionLinesService: RequisitionLinesService,
    private readonly stockMovesService: StockMovesService,
    private readonly itemUnitsService: ItemUnitsService,
    private readonly itemUnitUsageLogsService: ItemUnitUsageLogsService,
  ) {}

  async approve(requisition: any, personId: string, trx: any) {
    const itemsUnits =
      await this.requisitionLinesService.findItemsByRequisitionId(
        requisition.id,
      );

    const invalidUnits = itemsUnits.filter((unit: any) => {
      return (
        unit.location_id !== requisition.source_location_id ||
        unit.status !== 'AVAILABLE'
      );
    });

    if (invalidUnits.length > 0) {
      throw new ConflictException('Hay unidades inválidas para renta');
    }

    const ids = itemsUnits.map((u: any) => u.id);

    await this.itemUnitsService.updateMany(
      ids,
      { status: 'RESERVED', updated_at: new Date() },
      trx,
    );
  }

  async execute(requisition: any, personId: string, trx: any) {
    const lines =
      await this.requisitionLinesService.findByRequisitionId(
        requisition.id,
      );

    const destination = LOCATIONS.TRANSIT;

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

    const itemsUnits =
      await this.requisitionLinesService.findItemsByRequisitionId(
        requisition.id,
      );

    const ids = itemsUnits.map((u: any) => u.id);

    await this.itemUnitsService.updateMany(
      ids,
      {
        status: 'IN_TRANSIT',
        location_id: destination,
        updated_at: new Date(),
      },
      trx,
    );

    // 🔥 Usage logs
    const logPayload = ids.map((id: number) => ({
      item_unit_id: id,
      requisition_id: requisition.id,
      start_at: new Date(),
      created_at: new Date(),
    }));

    await this.itemUnitUsageLogsService.createMany(
      logPayload,
      trx,
    );
  }

  async receive(requisition: any, personId: string, trx: any) {
    const itemsUnits =
      await this.requisitionLinesService.findItemsByRequisitionId(
        requisition.id,
      );

    const ids = itemsUnits.map((u: any) => u.id);

    await this.itemUnitsService.updateMany(
      ids,
      {
        status: 'RENTED',
        location_id: requisition.destination_location_id,
        updated_at: new Date(),
      },
      trx,
    );
  }
}
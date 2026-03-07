import {
  Injectable,
  ConflictException,
} from '@nestjs/common';

import { RequisitionHandler } from './requisition-handler.interface';
import { RequisitionLinesService } from 'src/requisition-lines/requisition-lines.service';
import { StockMovesService } from 'src/stock_moves/stock_moves.service';
import { ItemUnitsService } from 'src/item-units/item-units.service';
import { ItemUnitUsageLogsService } from 'src/item_unit_usage_logs/item_unit_usage_logs.service';
import { LOCATIONS } from '../constants/locations';


@Injectable()
export class ReturnHandler implements RequisitionHandler {
  constructor(
    private readonly requisitionLinesService: RequisitionLinesService,
    private readonly stockMovesService: StockMovesService,
    private readonly itemUnitsService: ItemUnitsService,
    private readonly itemUnitUsageLogsService: ItemUnitUsageLogsService,
  ) {}

  async approve(requisition: any, personId: string, trx: any) {
    const items =
      await this.requisitionLinesService.findItemsByRequisitionId(
        requisition.id,
      );

    const invalid = items.filter(
      (u: any) =>
        u.location_id !== requisition.source_location_id ||
        u.status !== 'RENTED',
    );

    if (invalid.length) {
      throw new ConflictException(
        'Hay unidades inválidas para devolución',
      );
    }

    const ids = items.map((u: any) => u.id);

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
  }

  async receive(requisition: any, personId: string, trx: any) {
    const receiptDate = new Date();

    const lines =
      await this.requisitionLinesService.findByRequisitionId(
        requisition.id,
      );

    const ids = lines.map((l: any) => l.item_unit_id);

    await this.itemUnitsService.updateMany(
      ids,
      {
        status: 'AVAILABLE',
        location_id: requisition.destination_location_id,
        updated_at: receiptDate,
      },
      trx,
    );

    // 🔥 cerrar usage logs
    const logs = await trx('item_unit_usage_logs')
      .whereIn('item_unit_id', ids)
      .whereNull('end_at');

    const updates = logs.map((log: any) => {
      const start = new Date(log.start_at);

      const diffDays = Math.max(
        1,
        Math.ceil(
          (receiptDate.getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      return {
        id: log.id,
        end_at: receiptDate,
        hours_used: diffDays * 8, // puedes reemplazar por usage_hours real
      };
    });

    await this.itemUnitUsageLogsService.updateMany(
      updates,
      trx,
    );
  }
}
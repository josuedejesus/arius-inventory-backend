import { ForbiddenException, Injectable } from '@nestjs/common';
import { RequisitionHandler } from './requisition-handler.interface';
import { ItemUnitsService } from '../../item-units/item-units.service';
import { StockMovesService } from 'src/stock_moves/stock_moves.service';
import { LOCATIONS } from '../constants/locations';

@Injectable()
export class InternalTransferHandler implements RequisitionHandler {
  constructor(
    private readonly stockMovesService: StockMovesService,
    private readonly itemUnitsService: ItemUnitsService,
  ) {}

  async execute(requisition: any, personId: string, trx: any) {
    const lines = await trx('requisition_lines')
      .where({ requisition_id: requisition.id });

    const movements = lines.map((l: any) => ({
      requisition_id: requisition.id,
      item_id: l.item_id,
      item_unit_id: l.item_unit_id,
      quantity: l.quantity,
      source_location_id: l.location_id,
      destination_location_id: LOCATIONS.TRANSIT,
      executed_by: personId,
      executed_at: new Date(),
    }));

    await this.stockMovesService.createMany(movements, trx);

    const ids = lines.map((l: any) => l.item_unit_id);

    await this.itemUnitsService.updateMany(
      ids,
      {
        status: 'IN_TRANSIT',
        location_id: LOCATIONS.TRANSIT,
        updated_at: new Date(),
      },
      trx,
    );
  }
}
import { Injectable } from '@nestjs/common';
import { RequisitionHandler } from './requisition-handler.interface';
import { ItemUnitsService } from '../../item-units/item-units.service';

@Injectable()
export class PurchaseReceiptHandler implements RequisitionHandler {
  constructor(private readonly itemUnitsService: ItemUnitsService) {}

  async approve(requisition: any, personId: string, trx: any) {
    const lines = await trx('requisition_lines').where({
      requisition_id: requisition.id,
    });

    const ids = lines.map((l: any) => l.item_unit_id);

    await this.itemUnitsService.updateMany(
      ids,
      {
        status: 'RESERVED',
        updated_at: new Date(),
      },
      trx,
    );
  }

  async execute(requisition: any, personId: string, trx: any) {
    const lines = await trx('requisition_lines').where({
      requisition_id: requisition.id,
    });

    const ids = lines.map((l: any) => l.item_unit_id);

    await this.itemUnitsService.updateMany(
      ids,
      {
        status: 'AVAILABLE',
        updated_at: new Date(),
      },
      trx,
    );
  }
}

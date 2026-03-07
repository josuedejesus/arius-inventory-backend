import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ItemUnitsService } from 'src/item-units/item-units.service';

@Injectable()
export class RequisitionLineAccessoriesService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    private readonly itemUnitsService: ItemUnitsService,
  ) {}

  async createMany(accessories: any[], trx = null) {
    const db = trx || this.db;

    const createdAccessories = await db('requisition_lines')
      .insert(accessories)
      .returning('*');

    return createdAccessories;
  }

  async getByRequisitionLine(requisitionLineId: string) {
    const accessories = await this.db('requisition_line_accessories')
      .join(
        'accessories',
        'accessories.id',
        'requisition_line_accessories.accessory_id',
      )
      .select('requisition_line_accessories.*', 'accessories.name')
      .where({
        id: requisitionLineId,
      });

    return accessories;
  }

  async findByItemUnit(itemUnitId: string) {
    const itemUnit = await this.itemUnitsService.findById(itemUnitId);

    if (!itemUnit) {
      throw new NotFoundException('Articulo no encontrado');
    }

    const unitWithAccessories = await this.db('item_units as iu')
  .join('items as i', 'i.id', 'iu.item_id')

  .join('requisition_lines as rl', 'rl.item_unit_id', 'iu.id')

  .join('requisitions as r', 'r.id', 'rl.requisition_id')

  .leftJoin(
    'requisition_line_accessories as rla',
    'rla.requisition_line_id',
    'rl.id'
  )
  .leftJoin(
    'accessories as acc',
    'acc.id',
    'rla.accessory_id'
  )

  .select(
    'iu.*',
    'i.name as item_name',
    'i.brand',
    'i.model',
    'r.id as rent_requisition_id',
    'rl.id as line_id',
    'rl.quantity as rented_quantity',

    this.db.raw(`
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'accessory_id', acc.id,
            'name', acc.name,
            'quantity', rla.quantity
          )
        ) FILTER (WHERE acc.id IS NOT NULL),
        '[]'
      ) as accessories
    `)
  )

  .where('iu.id', itemUnitId)
  .andWhere('r.type', 'RENT')

  .groupBy(
    'iu.id',
    'i.id',
    'r.id',
    'rl.id'
  )
  .first();


    return unitWithAccessories;
  }
}

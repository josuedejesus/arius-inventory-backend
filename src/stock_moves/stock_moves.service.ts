import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class StockMovesService {
  constructor(@Inject('KNEX') private readonly db: any) {}

  async createMany(items: any, trx: any = null) {
    const db = trx || this.db;

    return db('stock_moves').insert(items);
  }

  async findByLocation(locationId: string) {
  return this.db('stock_moves')
    .join('items', 'items.id', 'stock_moves.item_id')

    // unidad de medida (SIEMPRE)
    .join('units', 'units.id', 'items.unit_id')

    // unidad física (OPCIONAL)
    .leftJoin('item_units', 'item_units.id', 'stock_moves.item_unit_id')

    .select(
      'stock_moves.*',
      'items.name as item_name',
      'items.model as item_model',
      'items.brand as item_brand',
      'units.code as unit_code',
      'item_units.internal_code as internal_code'
    )

    .where(function () {
      this.where('stock_moves.source_location_id', locationId)
          .orWhere('stock_moves.destination_location_id', locationId);
    })

    .orderBy('stock_moves.id', 'desc');
}



  async findByUnitId(unitId: string) {
    return this.db('stock_moves')
      .leftJoin(
        { source_location: 'locations' },
        'source_location.id',
        'stock_moves.source_location_id',
      )
      .leftJoin(
        { destination_location: 'locations' },
        'destination_location.id',
        'stock_moves.destination_location_id',
      )
      .where('stock_moves.item_unit_id', unitId)
      .select(
        'stock_moves.*',
        'source_location.name as source_location_name',
        'destination_location.name as destination_location_name',
      )
      .orderBy('stock_moves.id', 'desc');
  }
}

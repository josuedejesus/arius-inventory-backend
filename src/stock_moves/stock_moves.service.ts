import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class StockMovesService {
  constructor(@Inject('KNEX') private readonly db: any) {}

  async createMany(items: any, trx: any = null) {
    const db = trx || this.db;

    return db('stock_moves').insert(items);
  }

  async findByLocation(locationId: string, limit = 10) {
    return (
      this.db('stock_moves as sm')
        .join('items as i', 'i.id', 'sm.item_id')
        .join('units as u', 'u.id', 'i.unit_id')

        .leftJoin('item_units as iu', 'iu.id', 'sm.item_unit_id')

        .leftJoin(
          { source_location: 'locations' },
          'source_location.id',
          'sm.source_location_id',
        )
        .leftJoin(
          { destination_location: 'locations' },
          'destination_location.id',
          'sm.destination_location_id',
        )

        .select(
          'sm.id',
          'sm.quantity',
          'sm.source_location_id',
          'sm.destination_location_id',

          'i.name as item_name',
          'i.model as item_model',
          'i.brand as item_brand',

          'u.code as unit_code',

          'iu.internal_code',

          'source_location.name as source_location_name',
          'destination_location.name as destination_location_name',

          // 🔥 movement_type
          this.db.raw(
            `
        CASE 
          WHEN sm.destination_location_id = ? THEN 'ENTRY'
          WHEN sm.source_location_id = ? THEN 'EXIT'
        END as movement_type
      `,
            [locationId, locationId],
          ),

          // 🔥 movement_date CORRECTO
          this.db.raw(
            `
        CASE 
          WHEN sm.destination_location_id = ? THEN sm.received_at
          WHEN sm.source_location_id = ? THEN sm.executed_at
          ELSE COALESCE(sm.executed_at, sm.received_at)
        END as movement_date
      `,
            [locationId, locationId],
          ),
        )

        .where(function () {
          this.where('sm.source_location_id', locationId).orWhere(
            'sm.destination_location_id',
            locationId,
          );
        })

        // 🔥 ordenar por la fecha correcta
        .orderByRaw(
          `
      CASE 
        WHEN sm.destination_location_id = ${locationId} THEN sm.received_at
        WHEN sm.source_location_id = ${locationId} THEN sm.executed_at
        ELSE COALESCE(sm.executed_at, sm.received_at)
      END DESC
    `,
        )

        .limit(limit)
    );
  }

  async findByUnitId(unitId: string) {
    return this.db('stock_moves as sm')
      .leftJoin(
        { source_location: 'locations' },
        'source_location.id',
        'sm.source_location_id',
      )
      .leftJoin(
        { destination_location: 'locations' },
        'destination_location.id',
        'sm.destination_location_id',
      )
      .where('sm.item_unit_id', unitId)

      .where(function () {
        this.whereNotNull('sm.source_location_id').orWhereNotNull(
          'sm.destination_location_id',
        );
      })

      .select(
        'sm.*',

        'source_location.name as source_location_name',
        'destination_location.name as destination_location_name',

        this.db.raw(`
        CASE 
          WHEN sm.source_location_id IS NOT NULL THEN sm.executed_at
          WHEN sm.destination_location_id IS NOT NULL THEN sm.received_at
          ELSE COALESCE(sm.executed_at, sm.received_at)
        END as movement_date
      `),
      ).orderByRaw(`
      CASE 
        WHEN sm.source_location_id IS NOT NULL THEN sm.executed_at
        WHEN sm.destination_location_id IS NOT NULL THEN sm.received_at
        ELSE COALESCE(sm.executed_at, sm.received_at)
      END DESC
    `);
  }

  async findByRequisitionId(requisitionId: number) {
    return this.db('stock_moves')
      .where('requisition_id', requisitionId)
      .andWhere('is_deleted', false);
  }
}

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RequisitionLinesService {
  constructor(@Inject('KNEX') private readonly db: any) {}

  async createMany(lines: any, trx: any = null) {
    const db = trx || this.db;

    const createdLines = await db('requisition_lines')
      .insert(lines)
      .returning('*');

    return createdLines;
  }

  async findByRequisitionId(requisitionId: number, trx: any = null) {
    const db = trx || this.db;
    const lines = await db('requisition_lines')
      .join('items', 'items.id', 'requisition_lines.item_id')

      .leftJoin('item_units', 'item_units.id', 'requisition_lines.item_unit_id')

      .leftJoin(
        'requisition_line_photos',
        'requisition_line_photos.requisition_line_id',
        'requisition_lines.id',
      )

      .join('units', 'units.id', 'items.unit_id')

      // ACCESSORIES
      .leftJoin(
        'requisition_line_accessories as rla',
        'rla.requisition_line_id',
        'requisition_lines.id',
      )
      .leftJoin('accessories as acc', 'acc.id', 'rla.accessory_id')

      // SOURCE LOCATION (puede ser null)
      .leftJoin(
        { source_location: 'locations' },
        'source_location.id',
        'requisition_lines.source_location_id',
      )

      // DESTINATION LOCATION (siempre existe)
      .join(
        { destination_location: 'locations' },
        'destination_location.id',
        'requisition_lines.destination_location_id',
      )

      .select(
        'requisition_lines.*',

        'items.name as item_name',
        'items.brand as item_brand',
        'items.model as item_model',

        'item_units.internal_code as internal_code',
        'item_units.location_id as location_id',
        'item_units.status as status',

        'units.code as unit_code',
        'units.name as unit_name',

        // locations
        'source_location.name as source_location_name',
        'destination_location.name as destination_location_name',

        this.db.raw(
          'COUNT(DISTINCT requisition_line_photos.id) as photos_count',
        ),

        this.db.raw(`
        EXISTS (
          SELECT 1
          FROM requisition_lines rl_child
          WHERE rl_child.return_of_line_id = requisition_lines.id
        ) as has_return
      `),

        this.db.raw(`
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', acc.id,
              'name', acc.name,
              'quantity', rla.quantity
            )
          ) FILTER (WHERE acc.id IS NOT NULL),
          '[]'
        ) as accessories
      `),
      )

      .where('requisition_lines.requisition_id', requisitionId)

      .groupBy(
        'requisition_lines.id',

        'items.name',
        'items.brand',
        'items.model',

        'item_units.internal_code',
        'item_units.location_id',
        'item_units.status',

        'units.code',
        'units.name',

        // locations (IMPORTANTE)
        'source_location.name',
        'destination_location.name',
      );

    return lines;
  }

  async findItemsByRequisitionId(requisitionId: number) {
    const lines = await this.db('requisition_lines')
      .leftJoin('item_units', 'item_units.id', 'requisition_lines.item_unit_id')
      .select('item_units.*')
      .where('requisition_lines.requisition_id', requisitionId);

    return lines;
  }

  async updateMany(lines: any, trx: any = null) {
    const db = trx || this.db;

    return true;
  }

  async getNotReturnedByLocation(locationId: string) {
    const lines = await this.db('requisition_lines')
      .join('item_units', 'requisition_lines.item_unit_id', 'item_units.id')
      .join(
        'requisitions',
        'requisitions.id',
        'requisition_lines.requisition_id',
      )
      .join('items', 'items.id', 'item_units.item_id')
      .join('locations', 'locations.id', 'item_units.location_id')
      .join('units', 'units.id', 'items.unit_id')
      .where('item_units.location_id', locationId)
      .where(
        'requisition_lines.id',
        '=',
        this.db('requisition_lines as rl2')
          .where(
            'rl2.item_unit_id',
            this.db.ref('requisition_lines.item_unit_id'),
          )
          .max('rl2.id'),
      )
      .whereIn('requisitions.type', ['RENT', 'TRANSFER'])
      .select(
        'requisition_lines.*',
        'requisition_lines.id as requisition_line_id',
        'items.name as item_name',
        'item_units.id as item_unit_id',
        'item_units.internal_code as internal_code',
        'item_units.location_id as location_id',
        'items.brand',
        'items.model',
        'items.id as item_id',
        'items.tracking',
        'locations.name as location_name',
        'units.code as unit_code',
        'units.name as unit_name',
      );

    return lines;
  }

  async getReturnStatus(requisitionId: string) {
    const requisitionLines = await this.db('requisition_lines').where({
      requisition_id: requisitionId,
    });

    const lineIds = requisitionLines.map((r) => r.id);

    const returned = await this.db('requisition_lines').whereIn(
      'return_of_line_id',
      lineIds,
    );

    let hasReturned = false;
    if (returned.length > 0) {
      hasReturned = true;
    }

    return hasReturned;
  }

  async getManyByIds(ids: number[], trx: any = null) {
    const db = trx || this.db;

    return await db('requisition_lines').whereIn('id', ids);
  }
}

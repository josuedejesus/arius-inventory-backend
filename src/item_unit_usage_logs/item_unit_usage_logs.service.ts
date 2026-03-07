import { Inject, Injectable } from '@nestjs/common';
import { createItemUnitUsageLogDto } from './dto/create-item-unit-usage-log.dto';

@Injectable()
export class ItemUnitUsageLogsService {
  constructor(@Inject('KNEX') private readonly db: any) {}

  async createMany(dto_array: createItemUnitUsageLogDto[], trx: any = null) {
    const db = trx || this.db;

    await db('item_unit_usage_logs').insert(dto_array).returning('*');

    return true;
  }

  async updateMany(dto_array: any[], trx?: any) {
    const db = trx || this.db;

    if (!dto_array?.length) return;

    for (const dto of dto_array) {
      const { id, ...data } = dto;

      if (!id) continue;

      await db('item_unit_usage_logs')
        .where('id', Number(id)) // <- importante si viene string
        .update({
          ...data,
          updated_at: new Date(),
        });
    }

    return true;
  }

  async findByRequisition(requisitionId: string, trx: any) {
    const db = trx || this.db;

    return db('item_unit_usage_logs').where({
      requisition_id: requisitionId,
    });
  }

  async findByItemUnit(unitId: string) {
    const usageLogs = await this.db('item_unit_usage_logs')
      .join(
        'requisitions',
        'requisitions.id',
        'item_unit_usage_logs.requisition_id',
      )
      .join('locations', 'locations.id', 'requisitions.destination_location_id')
      .select('item_unit_usage_logs.*', 'locations.name as location_name')
      .where({
        item_unit_id: unitId,
      });

    return usageLogs;
  }

  async getManyByRequisitionIds(ids: number[], trx: any = null) {
    const db = trx || this.db;

    return await db('item_unit_usage_logs').whereIn('requisition_id', ids);
  }
}

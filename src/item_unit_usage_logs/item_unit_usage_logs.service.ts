import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createItemUnitUsageLogDto } from './dto/create-item-unit-usage-log.dto';
import { NotificationConfigurationFilter$ } from '@aws-sdk/client-s3';
import { ItemUnitsService } from 'src/item-units/item-units.service';
import { ItemsService } from 'src/items/items.service';

@Injectable()
export class ItemUnitUsageLogsService {
  constructor(@Inject('KNEX') private readonly db: any, private readonly itemUnitsService: ItemUnitsService, private readonly itemsService: ItemsService) {}

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

  async findLastActiveByItemUnit(unitId: string) {
    const usageLog = await this.db('item_unit_usage_logs')
      .where({ item_unit_id: unitId })
      .andWhere('end_at', null)
      .orderBy('created_at', 'desc')
      .first();

    if (!usageLog) return null;

    const itemUnit = await this.itemUnitsService.findById(unitId);

    if (!itemUnit) throw new NotFoundException('No se encontró la unidad de ítem asociada al registro de uso.');

    const item = await this.itemsService.findById(itemUnit.item_id);

    if (!item) throw new NotFoundException('No se encontró el ítem asociado a la unidad del registro de uso.');

    const now = new Date();
    const start = new Date(usageLog.start_at);
    //calcular la cantidad de días entre start y now enteros, redondos hacia arriba
    const days = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const usageHours = days * Number(item.usage_hours || 0);

    console.log(item);

    return {
      ...usageLog,
      usage_hours: usageHours,
      usage_days: days,
    };
  }
}

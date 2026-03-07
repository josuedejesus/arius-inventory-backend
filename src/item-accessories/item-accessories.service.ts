import { Inject, Injectable } from '@nestjs/common';
import { CreateItemAccessoryDto } from './dto/create-item-accessory.dto';

@Injectable()
export class ItemAccessoriesService {
  constructor(@Inject('KNEX') private readonly db: any) {}

  async findByItem(itemId: any, trx: any = null) {
    console.log(itemId);
    
    const db = this.db || trx;

    return db('item_accessories')
      .join('accessories', 'accessories.id', 'item_accessories.accessory_id')
      .select(
        'item_accessories.*',
        'accessories.name',
        'accessories.description',
        'accessories.is_active',
      )
      .where({
        item_id: itemId,
      })
      .orderBy('name', 'asc');
  }

  async createAccessory(dto: CreateItemAccessoryDto) {
    const [accessory] = await this.db('item-accessories')
      .insert(dto)
      .returning('*');

    return accessory;
  }

  async createMany(accessories: CreateItemAccessoryDto[], trx: any) {
    return trx('item_accessories').insert(accessories);
  }

  async removeMany(accessoryIds: number[], trx: any) {
    return trx('item_accessories').whereIn('id', accessoryIds).del();
  }
}

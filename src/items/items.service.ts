import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemAccessoriesService } from 'src/item-accessories/item-accessories.service';
import { CreateItemAccessoryDto } from 'src/item-accessories/dto/create-item-accessory.dto';
import { CreateAccessoryDto } from 'src/accessories/dto/create-accessory.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemUnitsService } from 'src/item-units/item-units.service';
import { ItemType } from './enums/item-type.enum';
import { ItemViewModel } from './dto/item-view-model';

@Injectable()
export class ItemsService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    @Inject(forwardRef(() => ItemUnitsService))
    private readonly itemUnitsService: ItemUnitsService,
    private readonly itemAccessoriesService: ItemAccessoriesService,
  ) {}

  async getItems() {
    return (
      this.db('items')
        .join('units', 'units.id', 'items.unit_id')

        // SERIAL → unidades físicas disponibles
        .leftJoin('item_units', function () {
          this.on('item_units.item_id', '=', 'items.id').andOnVal(
            'item_units.status',
            '=',
            'AVAILABLE',
          );
        })

        .select(
          'items.*',
          'units.name as unit_name',
          'units.code as unit_code',

          this.db.raw(`
        CASE
          WHEN items.tracking = 'SERIAL'
          THEN COUNT(item_units.id)
          ELSE (
            SELECT COALESCE(
              SUM(
                CASE
                  WHEN sm.destination_location_id = l.id THEN sm.quantity
                  ELSE 0
                END
              ) -
              SUM(
                CASE
                  WHEN sm.source_location_id = l.id THEN sm.quantity
                  ELSE 0
                END
              ), 0
            )
            FROM stock_moves sm
            JOIN locations l
              ON (l.id = sm.destination_location_id OR l.id = sm.source_location_id)
            WHERE sm.item_id = items.id
              AND l.type = 'WAREHOUSE'
          )
        END as availableCount
      `),
        )

        .groupBy('items.id', 'units.name', 'units.code', 'items.tracking')

        .orderBy('items.name', 'asc')
    );
  }

  async findAll(type?: ItemType): Promise<ItemViewModel[]> {
    let query = this.db('items')
      .join('units', 'units.id', 'items.unit_id')
      .select('items.*', 'units.name as unit_name', 'units.code as unit_code')
      .orderBy('items.name', 'asc');

    if (type) {
      query = query.where('items.type', type);
    }

    const items: ItemViewModel[] = await query;

    return items;
  }

  async create(dto: CreateItemDto) {
    return this.db.transaction(async (trx: any) => {
      const [item] = await trx('items')
        .insert({
          name: dto.name,
          brand: dto.brand,
          model: dto.model,
          type: dto.type,
          tracking: dto.tracking,
          unit_id: dto.unit_id,
          is_active: dto.is_active,
          minimum_stock: dto.minimum_stock,
        })
        .returning('*');

      if (dto.accessories.length) {
        const accessoriesToInsert: CreateItemAccessoryDto[] =
          dto.accessories!.map((a: any) => ({
            item_id: item.id,
            accessory_id: a.id,
            required: false,
            is_active: true,
          }));

        await this.itemAccessoriesService.createMany(accessoriesToInsert, trx);
      }

      if (dto.item_units.length) {
        const itemUnitsToInsert = dto.item_units.map((iu: any) => ({
          item_id: item.id,
          serial_number: iu.serial_number,
          internal_code: iu.internal_code,
          status: iu.status,
          condition: iu.condition,
          description: iu.description,
          observations: iu.observations,
          is_active: iu.is_active,
          image_path: iu.image_path,
        }));

        await this.itemUnitsService.createMany(itemUnitsToInsert, trx);
        //await this.db('item_units').insert(itemUnitsToInsert);
      }

      return item;
    });
  }

  async update(dto: UpdateItemDto, id: number) {
    return this.db.transaction(async (trx: any) => {
      const item = await this.findById(String(id));
      if (!item) {
        throw new NotFoundException('Articulo no encontrado');
      }

      await trx('items')
        .where({
          id: id,
        })
        .update({
          name: dto.name,
          brand: dto.brand,
          model: dto.model,
          type: dto.type,
          tracking: dto.tracking,
          unit_id: dto.unit_id,
          is_active: dto.is_active,
          updated_at: new Date(),
          minimum_stock: dto.minimum_stock,
          usage_hours: dto.usage_hours,
        });

      const existingAccessories =
        await this.itemAccessoriesService.findByItem(id);

      const incomingIds = new Set(dto.accessories.map((m) => m.id));

      const existingIds = new Set(
        existingAccessories.map((m) => m.accessory_id),
      );

      const toAdd = dto.accessories.filter((m) => !existingIds.has(m.id));

      const toRemove = existingAccessories
        .filter((m: any) => !incomingIds.has(m.id))
        .map((m: any) => m.id);

      const toAddMapped = toAdd.map((m) => ({
        item_id: id,
        accessory_id: m.id,
        is_active: true,
      }));

      if (toAddMapped.length) {
        await this.itemAccessoriesService.createMany(toAddMapped, trx);
      }

      if (toRemove.length) {
        await this.itemAccessoriesService.removeMany(toRemove, trx);
      }

      return dto;
    });
  }

  async getItem(id: string, trx: any = null) {
    const db = this.db || trx;

    return db('items')
      .where({
        id: id,
      })
      .first();
  }

  async findById(id: string) {
    return this.db('items')
      .join('units', 'units.id', 'items.unit_id')
      .select('items.*', 'units.name as unit_name', 'units.code as unit_code')
      .where('items.id', id)
      .first();
  }

  async getStats() {
    const data = await this.db('item_units')
      .join('items', 'items.id', 'item_units.item_id')
      .whereIn('item_units.status', [
        'AVAILABLE',
        'RESERVED',
        'IN_TRANSIT',
        'RENTED',
      ])
      .groupBy('items.id', 'items.name', 'item_units.status')
      .select(
        'items.id as item_id',
        'items.name as item_name',
        'item_units.status',
        this.db.raw('COUNT(*) as count'),
      );
    return data;
  }

  async findAllSupplies() {
    const supplies = await this.db('items')
      .join('units', 'units.id', 'items.unit_id')
      .where({
        type: ItemType.SUPPLY,
      })
      .select('items.*', 'units.code as unit_code', 'units.name as unit_name');

    return supplies;
  }

  async findAllAvailableSupplies() {
    const supplies = await this.db('items')
      .join('units', 'units.id', 'items.unit_id')
      .where({ 'items.type': ItemType.SUPPLY })
      .select(
        'items.*',
        'units.code as unit_code',
        'units.name as unit_name',
        this.db.raw(`
        COALESCE((
          SELECT SUM(sm.quantity)
          FROM stock_moves sm
          INNER JOIN locations l ON l.id = sm.destination_location_id
          WHERE sm.item_id = items.id AND l.type = 'WAREHOUSE'
        ), 0)
        -
        COALESCE((
          SELECT SUM(sm.quantity)
          FROM stock_moves sm
          INNER JOIN locations l ON l.id = sm.source_location_id
          WHERE sm.item_id = items.id AND l.type = 'WAREHOUSE'
        ), 0) AS available_quantity
      `),
      );

    return supplies;
  }

  async findSupplyById(id: number) {
    const [item] = await this.db('items')
      .join('units', 'units.id', 'items.unit_id')
      .where({ 'items.type': ItemType.SUPPLY, 'items.id': id })
      .select(
        'items.*',
        'units.code as unit_code',
        'units.name as unit_name',
        this.db.raw(`
        COALESCE((
          SELECT SUM(sm.quantity) FROM stock_moves sm
          INNER JOIN locations l ON l.id = sm.destination_location_id
          WHERE sm.item_id = items.id AND l.type = 'WAREHOUSE'
        ), 0)
        -
        COALESCE((
          SELECT SUM(sm.quantity) FROM stock_moves sm
          INNER JOIN locations l ON l.id = sm.source_location_id
          WHERE sm.item_id = items.id AND l.type = 'WAREHOUSE'
        ), 0) AS available_quantity
      `),
      );

    return item;
  }

  async getSuppliesStats() {
    const db = this.db;

    const result = await db
      .from(function () {
        this.select(
          'i.id',
          'i.name',
          'i.minimum_stock',
          db.raw(`
          COALESCE(
            SUM(CASE WHEN ld.type = 'WAREHOUSE' THEN sm.quantity ELSE 0 END)
            -
            SUM(CASE WHEN ls.type = 'WAREHOUSE' THEN sm.quantity ELSE 0 END),
          0) as stock
        `),
        )
          .from('items as i')
          .where('i.type', 'SUPPLY')
          .leftJoin('stock_moves as sm', 'sm.item_id', 'i.id')
          .leftJoin('locations as ld', 'ld.id', 'sm.destination_location_id')
          .leftJoin('locations as ls', 'ls.id', 'sm.source_location_id')
          .groupBy('i.id', 'i.name', 'i.minimum_stock')
          .as('s');
      })
      .select(
        db.raw('SUM(stock) as total_stock'),
        db.raw(
          'COUNT(*) FILTER (WHERE stock <= minimum_stock) as low_stock_items',
        ),
        db.raw(`
        COALESCE(
          json_agg(
            json_build_object(
              'id', id,
              'name', name,
              'stock', stock,
              'minimum_stock', minimum_stock
            )
            ORDER BY name
          ),
          '[]'
        ) as supplies_list
      `),
      )
      .first();

    console.log('item stats', result);

    return result;
  }

  async getItemStockLevels() {
    const db = this.db;

    return db('items as i')
      .where('i.type', 'SUPPLY')
      .leftJoin('stock_moves as sm', 'sm.item_id', 'i.id')
      .leftJoin('locations as ld', 'ld.id', 'sm.destination_location_id')
      .leftJoin('locations as ls', 'ls.id', 'sm.source_location_id')
      .select(
        'i.id',
        'i.name',
        'i.minimum_stock',
        db.raw(`
        COALESCE(
          SUM(CASE WHEN ld.type = 'WAREHOUSE' THEN sm.quantity ELSE 0 END)
          -
          SUM(CASE WHEN ls.type = 'WAREHOUSE' THEN sm.quantity ELSE 0 END),
        0) as stock
      `),
      )
      .groupBy('i.id', 'i.name', 'i.minimum_stock');
  }
}

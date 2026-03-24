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
import { PagedRequestDto } from 'src/requisitions/dto/PaginationDto';
import { RequisitionType } from 'src/requisitions/enums/requisition-type';
import { MovementType } from 'src/requisitions/enums/movement-type';
import { UsersService } from 'src/users/users.service';
import { PersonsService } from 'src/persons/persons.service';
import { LocationsService } from 'src/locations/locations.service';
import {
  getCatalogFilter,
  CatalogFilter,
} from './helpers/catalog-filter.helper';
import { ItemFilterDto } from './dto/item-filter-dto';
@Injectable()
export class ItemsService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    @Inject(forwardRef(() => ItemUnitsService))
    private readonly itemUnitsService: ItemUnitsService,
    private readonly itemAccessoriesService: ItemAccessoriesService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => PersonsService))
    private readonly personService: PersonsService,
    private readonly locationService: LocationsService,
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
      .orderBy('items.updated_at', 'desc');

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
          usage_hours: dto.usage_hours,
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

      // 🔷 agregar
      const toAdd = dto.accessories.filter((m) => !existingIds.has(m.id));

      // 🔷 eliminar (FIX)
      const toRemove = existingAccessories
        .filter((m: any) => !incomingIds.has(m.accessory_id))
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

  async findById(id: string, trx: any = null) {
    const db = trx || this.db;
    return db('items')
      .join('units', 'units.id', 'items.unit_id')
      .select('items.*', 'units.name as unit_name', 'units.code as unit_code')
      .where('items.id', id)
      .first();
  }

  async findAllWithProperties(filters?: {
    locationId?: number;
    requisitionType?: RequisitionType;
  }) {
    const result = await this.db.raw(`
    WITH stock_by_location AS (
      SELECT
        sm.item_id,
        l.id   AS location_id,
        l.name AS location_name,
        COALESCE(SUM(CASE WHEN sm.destination_location_id = l.id THEN sm.quantity ELSE 0 END), 0)
        -
        COALESCE(SUM(CASE WHEN sm.source_location_id = l.id THEN sm.quantity ELSE 0 END), 0)
        AS available_quantity
      FROM stock_moves sm
      JOIN locations l
        ON l.id = sm.destination_location_id
        OR l.id = sm.source_location_id
      GROUP BY sm.item_id, l.id, l.name
    )

    SELECT
      i.id        AS item_id,
      NULL::int   AS item_unit_id,
      i.name,
      i.brand,
      i.model,
      i.type,
      i.tracking,
      i.image_path,
      u.code      AS unit_code,
      u.name      AS unit_name,
      sbl.location_id,
      sbl.location_name,
      sbl.available_quantity,
      NULL::text  AS status,
      NULL::text  AS internal_code
    FROM items i
    JOIN units u               ON u.id       = i.unit_id
    JOIN stock_by_location sbl ON sbl.item_id = i.id
    WHERE i.type = 'SUPPLY'

    UNION ALL

    SELECT
      i.id          AS item_id,
      iu.id         AS item_unit_id,
      i.name,
      i.brand,
      i.model,
      i.type,
      i.tracking,
      iu.image_path,
      u.code        AS unit_code,
      u.name        AS unit_name,
      l.id          AS location_id,
      l.name        AS location_name,
      1             AS available_quantity,
      iu.status::text,
      iu.condition::text,
      iu.internal_code
    FROM item_units iu
    JOIN items i          ON i.id  = iu.item_id
    JOIN units u          ON u.id  = i.unit_id
    LEFT JOIN locations l ON l.id  = iu.location_id

    ORDER BY name ASC
  `);

    return result.rows;
  }

  async getCatalog(
    movement: MovementType,
    type: RequisitionType,
    userId: number,
  ) {
    const user = await this.usersService.findById(String(userId));
    const person = await this.personService.findById(user.person_id);
    const assigedLocations = await this.locationService.findByUser(userId);

    const filter = getCatalogFilter(
      movement,
      type,
      person.role,
      assigedLocations.map((l) => l.id),
    );

    console.log('Catalog filter:', filter);

    const [itemUnits, supplies] = await Promise.all([
      filter.itemUnits !== false
        ? this.itemUnitsService.getCatalog(filter.itemUnits as any)
        : Promise.resolve([]),
      filter.supplies !== false
        ? this.findSupplyCatalog(filter.supplies as any)
        : Promise.resolve([]),
    ]);

    console.log('Catalog item units:', itemUnits);
    console.log('Catalog supplies:', supplies);

    return {
      itemUnits,
      supplies,
    };
  }

  async findSupplyCatalog(filter: ItemFilterDto) {
    const locationTypeFilter = filter.locationType
      ? `AND l.type = '${filter.locationType}'`
      : '';

    const locationIdsFilter = filter.locationIds?.length
      ? `AND l.id = ANY(ARRAY[${filter.locationIds.join(',')}])`
      : '';

    // Si es unlimited no filtra por stock > 0
    const havingClause = filter.unlimited
      ? ''
      : `HAVING
        COALESCE(SUM(CASE WHEN sm.destination_location_id = l.id THEN sm.quantity ELSE 0 END), 0)
        -
        COALESCE(SUM(CASE WHEN sm.source_location_id = l.id THEN sm.quantity ELSE 0 END), 0)
        > 0`;

    const result = await this.db.raw(`
    WITH stock_by_location AS (
      SELECT
        sm.item_id,
        l.id   AS location_id,
        l.name AS location_name,
        COALESCE(SUM(CASE WHEN sm.destination_location_id = l.id THEN sm.quantity ELSE 0 END), 0)
        -
        COALESCE(SUM(CASE WHEN sm.source_location_id = l.id THEN sm.quantity ELSE 0 END), 0)
        AS available_quantity
      FROM stock_moves sm
      JOIN locations l
        ON l.id = sm.destination_location_id
        OR l.id = sm.source_location_id
      ${locationTypeFilter}
      ${locationIdsFilter}
      GROUP BY sm.item_id, l.id, l.name
      ${havingClause}
    )
    SELECT
      i.*,
      u.code AS unit_code,
      u.name AS unit_name,
      sbl.location_id,
      sbl.location_name,
      sbl.available_quantity
    FROM items i
    JOIN units u               ON u.id       = i.unit_id
    JOIN stock_by_location sbl ON sbl.item_id = i.id
    WHERE i.type = 'SUPPLY'
    ORDER BY i.name ASC
  `);

    return result.rows;
  }

  async getAvailableSupplies() {
    const supplies = await this.db.raw(`
      WITH stock_by_location AS (
        SELECT
          sm.item_id,
          l.id   AS location_id,
          l.name AS location_name,
          COALESCE(SUM(CASE WHEN sm.destination_location_id = l.id THEN sm.quantity ELSE 0 END), 0)
          -
          COALESCE(SUM(CASE WHEN sm.source_location_id      = l.id THEN sm.quantity ELSE 0 END), 0)
          AS available_quantity
        FROM stock_moves sm
        JOIN locations l
          ON l.id = sm.destination_location_id
          OR l.id = sm.source_location_id
        WHERE l.type = 'WAREHOUSE'
        GROUP BY sm.item_id, l.id, l.name
        HAVING
          COALESCE(SUM(CASE WHEN sm.destination_location_id = l.id THEN sm.quantity ELSE 0 END), 0)
          -
          COALESCE(SUM(CASE WHEN sm.source_location_id      = l.id THEN sm.quantity ELSE 0 END), 0)
          > 0
      )
      SELECT
        i.*,
        u.code AS unit_code,
        u.name AS unit_name,
        sbl.location_id,
        sbl.location_name,
        sbl.available_quantity
      FROM items i
      JOIN units u             ON u.id  = i.unit_id
      JOIN stock_by_location sbl ON sbl.item_id = i.id
      WHERE i.type = 'SUPPLY'
      ORDER BY i.name, sbl.location_name
    `);

    return supplies.rows;
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

  async getStockByLocation(locationId: number) {
    const db = this.db;

    return db('items as i')
      .where('i.type', 'SUPPLY')
      .leftJoin('stock_moves as sm', 'sm.item_id', 'i.id')
      .leftJoin('locations as ld', 'ld.id', 'sm.destination_location_id')
      .leftJoin('locations as ls', 'ls.id', 'sm.source_location_id')
      .select(
        'i.*',
        db.raw(
          `
        COALESCE(
          SUM(CASE WHEN ld.id = ? THEN sm.quantity ELSE 0 END)
          -
          SUM(CASE WHEN ls.id = ? THEN sm.quantity ELSE 0 END),
        0) as stock
      `,
          [locationId, locationId],
        ),
      )
      .groupBy('i.id', 'i.name', 'i.minimum_stock')
      .havingRaw(
        `
      COALESCE(
        SUM(CASE WHEN ld.id = ? THEN sm.quantity ELSE 0 END)
        -
        SUM(CASE WHEN ls.id = ? THEN sm.quantity ELSE 0 END),
      0) > 0
    `,
        [locationId, locationId],
      );
  }
}

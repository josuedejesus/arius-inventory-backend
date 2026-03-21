import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateItemUnitDto } from './dto/create-item-unit.dto';
import { ItemsService } from 'src/items/items.service';
import { LocationsService } from 'src/locations/locations.service';
import { UpdateItemUnitDto } from './dto/update-item-unit.dto';
import { StockMovesService } from 'src/stock_moves/stock_moves.service';
import { RequisitionType } from 'src/requisitions/enums/requisition-type';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/users/enums/user-role.enum';
import { ItemUnitStatus } from './enums/item-unit-status.enum';
import { RequisitionStatus } from 'src/requisitions/enums/requisition-status.enum';
import { filter } from 'rxjs';
import { ItemUnitFilterDto } from './dto/item-unit-filter.dto';

@Injectable()
export class ItemUnitsService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    @Inject(forwardRef(() => ItemsService))
    private readonly itemsService: ItemsService,
    private readonly locationsService: LocationsService,
    private readonly usersServices: UsersService,
  ) {}

  async create(dto: CreateItemUnitDto) {
    return this.db.transaction(async (trx: any) => {
      const item = await this.itemsService.getItem(dto.item_id, trx);

      if (!item) {
        throw new NotFoundException('Articulo no encontrado');
      }

      const itemUnit = await this.db('item_units').insert(dto).returning('*');

      return itemUnit;
    });
  }

  async createMany(dtos: CreateItemUnitDto[], trx: any) {
    return this.db('item_units').insert(dtos).transacting(trx);
  }

  async getItemUnits(itemId: string) {
    const item = await this.itemsService.findById(itemId);

    if (!item) {
      throw new NotFoundException('El articulo no existe');
    }

    if (item.tracking === 'SERIAL') {
      return this.db('item_units')
        .where({
          item_id: itemId,
        })
        .orderBy('id', 'asc');
    } else {
      return {
        availability: 'UNLIMITED',
      };
    }
  }

  async getItemUnitsWithNoLocation(itemId: string) {
    return this.db('item_units')
      .where('item_units.item_id', itemId)
      .whereNull('item_units.location_id')
      .orderBy('item_units.id', 'asc');
  }

  async getItemUnitsByLocation(itemId: string, locationId: string) {
    const item = await this.itemsService.findById(itemId);

    if (!item) {
      throw new NotFoundException('El articulo no existe');
    }

    if (item.tracking === 'SERIAL') {
      return this.db('item_units')
        .join('locations', 'locations.id', 'item_units.location_id')
        .select('item_units.*', 'locations.name as location_name')
        .where({
          item_id: itemId,
        })
        .andWhere({
          location_id: locationId,
        })
        .orderBy('id', 'asc');
    }

    // TRACKING NONE → calcular stock
    const result = await this.db('stock_moves')
      .where('item_id', itemId)
      .andWhere((qb) => {
        qb.where('destination_location_id', locationId).orWhere(
          'source_location_id',
          locationId,
        );
      })
      .select(
        this.db.raw(
          `
        SUM(
          CASE
            WHEN destination_location_id = ? THEN quantity
            ELSE 0
          END
        ) -
        SUM(
          CASE
            WHEN source_location_id = ? THEN quantity
            ELSE 0
          END
        ) as available
      `,
          [locationId, locationId],
        ),
      )
      .first();

    return {
      tracking: 'NONE',
      availability: 'LIMITED',
      available: Number(result?.available ?? 0),
      unit_name: item.unit_name,
    };
  }

  async update(dto: UpdateItemUnitDto, id: number) {
    return this.db.transaction(async (trx) => {
      const item = await this.itemsService.getItem(String(dto.item_id), trx);

      if (!item) {
        throw new NotFoundException('Articulo no encontrado');
      }

      const [unit] = await trx('item_units')
        .where({
          id: dto.id,
        })
        .update({
          serial_number: dto.serial_number,
          internal_code: dto.internal_code,
          status: dto.status,
          condition: dto.condition,
          observations: dto.observations,
          is_active: dto.is_active,
          description: dto.description,
          updated_at: new Date(),
          image_path: dto.image_path,
        })
        .returning('*');

      return unit;
    });
  }

  async updateManyLocation(units: any[], locationId: number, trx: any = null) {
    const db = this.db || trx;

    await db('item_units').whereIn('id', units).update({
      location_id: locationId,
      updated_at: new Date(),
    });
  }

  async updateMany(unitIds: number[], payload: any, trx?: any) {
    const db = trx || this.db;

    return db('item_units').whereIn('id', unitIds).update(payload);
  }

  async findById(unitId: string) {
    return this.db('item_units')
      .join('items', 'items.id', 'item_units.item_id')
      .leftJoin('locations', 'locations.id', 'item_units.location_id')
      .select(
        'item_units.*',
        'locations.name as location_name',
        'items.name',
        'items.model',
        'items.brand',
        'items.type',
      )
      .where({
        'item_units.id': unitId,
      })
      .first();
  }

  async findByItemId(itemId: string) {
    return this.db('item_units')
      .join('items', 'items.id', 'item_units.item_id')
      .join('units', 'units.id', 'items.unit_id')
      .leftJoin('locations', 'locations.id', 'item_units.location_id')
      .select(
        'item_id',
        'item_units.*',
        'item_units.id as item_unit_id',
        'items.name',
        'items.brand',
        'items.model',
        'items.type',
        'items.tracking',
        'units.code as unit_code',
        'units.name as unit_name',
        'locations.name as location',
      )
      .where('item_units.item_id', itemId)
      .orderBy('item_units.id', 'asc');
  }

  private async calculateStock(
    itemId: string,
    locationId: string,
    unitName: string,
  ) {
    const result = await this.db('stock_moves')
      .where('item_id', itemId)
      .andWhere((qb) => {
        qb.where('destination_location_id', locationId).orWhere(
          'source_location_id',
          locationId,
        );
      })
      .select(
        this.db.raw(
          `
        COALESCE(
          SUM(CASE WHEN destination_location_id = ? THEN quantity ELSE 0 END) -
          SUM(CASE WHEN source_location_id = ? THEN quantity ELSE 0 END),
          0
        ) as available
        `,
          [locationId, locationId],
        ),
      )
      .first();

    return {
      tracking: 'NONE',
      availability: 'LIMITED',
      available: Number(result?.available ?? 0),
      unit_name: unitName,
    };
  }

  async getItemUnitsByAvailability(
    itemId: string,
    requisitionType: string,
    locationId?: string,
  ) {
    const item = await this.itemsService.findById(itemId);

    if (!item) {
      throw new NotFoundException('El articulo no existe');
    }

    const isTransfer = requisitionType === 'INTERNAL_TRANSFER';
    const isRent = requisitionType === 'RENT';
    const isPurchaseOrAdjustment =
      requisitionType === 'PURCHASE_RECEIPT' ||
      requisitionType === 'ADJUSTMENT';

    // -----------------------
    // SERIAL
    // -----------------------
    if (item.tracking === 'SERIAL') {
      // ---- TRANSFERENCIA ----
      if (isTransfer) {
        if (!locationId) {
          throw new BadRequestException(
            'Transferencia interna requiere ubicación de origen',
          );
        }

        return this.db('item_units')
          .join('locations', 'locations.id', 'item_units.location_id')
          .select('item_units.*', 'locations.name as location_name')
          .where({
            'item_units.item_id': itemId,
            'item_units.location_id': locationId,
            'item_units.status': 'AVAILABLE',
          })
          .orderBy('item_units.id', 'asc');
      }

      // ---- RENT ----
      if (isRent) {
        return this.db('item_units')
          .join('locations', 'locations.id', 'item_units.location_id')
          .select('item_units.*', 'locations.name as location_name')
          .where('item_units.item_id', itemId)
          .andWhere('item_units.status', 'AVAILABLE')
          .orderBy('item_units.id', 'asc');
      }

      // ---- PURCHASE / ADJUSTMENT ----
      if (isPurchaseOrAdjustment) {
        return this.db('item_units')
          .leftJoin('locations', 'locations.id', 'item_units.location_id')
          .select('item_units.*', 'locations.name as location_name')
          .where('item_units.item_id', itemId)
          .whereNull('item_units.location_id')
          .orderBy('item_units.id', 'asc');
      }
    }

    // -----------------------
    // NONE
    // -----------------------

    // ---- PURCHASE / ADJUSTMENT → ilimitado ----
    if (isPurchaseOrAdjustment) {
      return {
        tracking: 'NONE',
        availability: 'UNLIMITED',
        available: null,
        unit_name: item.unit_name,
      };
    }

    // ---- TRANSFERENCIA → stock de una ubicación ----
    if (isTransfer) {
      if (!locationId) {
        throw new BadRequestException(
          'Transferencia interna requiere ubicación de origen',
        );
      }

      return this.calculateStock(itemId, locationId, item.unit_name);
    }

    // ---- RENT → stock solo de WAREHOUSES ----
    if (isRent) {
      const result = await this.db('stock_moves as sm')
        .join('locations as l', function () {
          this.on('l.id', '=', 'sm.destination_location_id').orOn(
            'l.id',
            '=',
            'sm.source_location_id',
          );
        })
        .where('sm.item_id', itemId)
        .andWhere('l.type', 'WAREHOUSE')
        .select(
          this.db.raw(`
          COALESCE(
            SUM(CASE WHEN sm.destination_location_id = l.id THEN sm.quantity ELSE 0 END) -
            SUM(CASE WHEN sm.source_location_id = l.id THEN sm.quantity ELSE 0 END),
            0
          ) as available
        `),
        )
        .first();

      return {
        tracking: 'NONE',
        availability: 'LIMITED',
        available: Number(result?.available ?? 0),
        unit_name: item.unit_name,
      };
    }

    return [];
  }

  async findByLocation(locationId: string) {
    return this.db('item_units')
      .join('items', 'items.id', 'item_units.item_id')
      .join('units', 'units.id', 'items.unit_id')
      .leftJoin('locations', 'locations.id', 'item_units.location_id')
      .select(
        'item_id',
        'item_units.*',
        'item_units.id',
        'items.name',
        'items.brand',
        'items.model',
        'items.type',
        'items.tracking',
        'units.code as unit_code',
        'units.name as unit_name',
        'locations.id as location_id',
        'locations.name as location_name',
      )
      .where({
        'item_units.location_id': locationId,
      })
      .orderBy('items.name', 'asc');
  }

  async findAll(filters?: ItemUnitFilterDto) {
    console.log(filters);
    const query = this.db('item_units')
      .join('items', 'items.id', 'item_units.item_id')
      .join('units', 'units.id', 'items.unit_id')
      .leftJoin('locations', 'locations.id', 'item_units.location_id')
      .select(
        'item_id',
        'item_units.*',
        'item_units.id as item_unit_id',
        'items.name',
        'items.brand',
        'items.model',
        'items.type',
        'items.tracking',
        'units.code as unit_code',
        'units.name as unit_name',
        'locations.name as location',
      )
      .orderBy('items.name', 'asc');

    if (filters?.status) {
      query.where('item_units.status', filters.status);
    }

    if (filters?.locationId !== undefined) {
      query.where('item_units.location_id', filters.locationId);
    }

    return await query;
  }

  async findAvailable() {
    return this.db('item_units')
      .join('items', 'items.id', 'item_units.item_id')
      .join('units', 'units.id', 'items.unit_id')
      .leftJoin('locations', 'locations.id', 'item_units.location_id')
      .select(
        'item_id',
        'item_units.*',
        'item_units.id as item_unit_id',
        'items.name',
        'items.brand',
        'items.model',
        'items.type',
        'items.tracking',
        'units.code as unit_code',
        'units.name as unit_name',
        'locations.name as location',
      )
      .where({
        'item_units.status': 'AVAILABLE',
      })
      .whereNotNull('item_units.location_id')
      .orderBy('items.name', 'asc');
  }

  async findUnasigned() {
    return this.db('item_units')
      .join('items', 'items.id', 'item_units.item_id')
      .join('units', 'units.id', 'items.unit_id')
      .leftJoin('locations', 'locations.id', 'item_units.location_id')
      .select(
        'item_id',
        'item_units.*',
        'item_units.id as item_unit_id',
        'items.name',
        'items.brand',
        'items.model',
        'items.type',
        'items.tracking',
        'units.code as unit_code',
        'units.name as unit_name',
        'locations.name as location',
      )
      .where({
        'item_units.status': 'AVAILABLE',
      })
      .whereNull('item_units.location_id')
      .orderBy('items.name', 'asc');
  }

  async getUnitStats(unitId: string) {
    const unit = await this.db('item_units').where({ id: unitId }).first();

    if (!unit) return null;

    const lastMove = await this.db('stock_moves')
      .where({ item_unit_id: unitId })
      .whereNotNull('received_at')
      .orderBy('received_at', 'desc')
      .first();

    const now = new Date();

    let daysInLocation = 0;

    if (lastMove?.received_at) {
      const diffMs = now.getTime() - new Date(lastMove.received_at).getTime();
      daysInLocation = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    return {
      unit_id: unitId,
      current_location_id: unit.location_id,
      days_in_current_location: daysInLocation,
      last_movement_at: lastMove?.received_at || null,
    };
  }

  async findRentItemAccessories(itemUnitId: string) {
    const itemUnit = await this.findById(itemUnitId);

    if (!itemUnit) {
      throw new NotFoundException('Articulo no encontrado');
    }

    if (itemUnit.status !== 'RENTED') {
      return [];
    }

    const accessories = await this.db('requisition_lines as rl')
      .join('requisitions as r', 'r.id', 'rl.requisition_id')
      .join(
        'requisition_line_accessories as rla',
        'rla.requisition_line_id',
        'rl.id',
      )
      .join('accessories as acc', 'acc.id', 'rla.accessory_id')

      .select(
        'rla.id as id',
        'acc.id as accessory_id',
        'acc.name',
        'rla.quantity',
      )

      .where('rl.item_unit_id', itemUnitId)
      .where('r.status', 'DONE') // 🔥 requisición completada
      .orderBy('rl.id', 'desc') // 🔥 última línea
      .limit(1); // 🔥 solo esa

    return accessories;
  }

  async findByRequisitionType(
    requisitionType: RequisitionType,
    destinationId: number,
    userId: number,
  ) {
    const user = await this.usersServices.findById(String(userId));

    const query = this.db('item_units')
      .join('items', 'items.id', 'item_units.item_id')
      .join('units', 'units.id', 'items.unit_id')
      .leftJoin('locations', 'locations.id', 'item_units.location_id')
      .select(
        'item_id',
        'item_units.*',
        'item_units.id as item_unit_id',
        'items.name',
        'items.brand',
        'items.model',
        'items.type',
        'items.tracking',
        'units.code as unit_code',
        'units.name as unit_name',
        'locations.name as location',
      );

    if (
      requisitionType === RequisitionType.ADJUSTMENT ||
      requisitionType === RequisitionType.PURCHASE_RECEIPT
    ) {
      query.whereNull('location_id');
      return await query;
    } else if (requisitionType === RequisitionType.TRANSFER) {
      console.log('Finding by transfer with destinationId', destinationId);
      query
        .where(function () {
          this.where('item_units.status', ItemUnitStatus.RENTED);
        })
        .whereNotNull('item_units.location_id');

      return await query;
    } else if (requisitionType === RequisitionType.RETURN) {
      if (
        user.role === UserRole.ADMIN ||
        user.role === UserRole.ADMINISTRATIVE_MANAGER ||
        user.role === UserRole.WAREHOUSE_MANAGER
      ) {
        query.where('status', ItemUnitStatus.RENTED);
        return await query;
      } else {
        const userLocations = await this.locationsService.findByUser(user.id);
        const userLocationIds = userLocations.map((l) => l.id);
        query.whereIn('item_units.location_id', userLocationIds);
        return await query;
      }
    } else if (requisitionType === RequisitionType.RENT) {
      query
        .where('status', ItemUnitStatus.AVAILABLE)
        .whereNotNull('location_id');
      return await query;
    }

    return [];
  }

  async findByStatus(id: number) {
    const item = await this.db('item_units')
      .join('items', 'items.id', 'item_units.item_id')
      .join('units', 'units.id', 'items.unit_id')
      .leftJoin('locations', 'locations.id', 'item_units.location_id')

      .select(
        'item_units.item_id',
        'item_units.*',
        'item_units.id as item_unit_id',

        'items.name',
        'items.brand',
        'items.model',
        'items.type',
        'items.tracking',

        'units.code as unit_code',
        'units.name as unit_name',

        'locations.name as location',

        this.db.raw(`
        CASE 
          WHEN item_units.status = 'RENTED' THEN (
            SELECT rl.id
            FROM requisition_lines rl
            JOIN requisitions r ON r.id = rl.requisition_id
            WHERE rl.item_unit_id = item_units.id
            AND r.status = 'DONE'
            ORDER BY rl.id DESC
            LIMIT 1
          )
          ELSE NULL
        END as return_of_id
      `),
      )
      .where('item_units.id', id)
      .first();

    return item;
  }

  async getStats() {
    const stats = await this.db('item_units as iu')
      .leftJoin('locations as l', 'l.id', 'iu.location_id')
      .select(
        this.db.raw('COUNT(*) as total_units'),

        this.db.raw(`
        COUNT(*) FILTER (WHERE iu.status = 'AVAILABLE') 
        as available_units
      `),

        this.db.raw(`
        COUNT(*) FILTER (WHERE iu.status = 'RENTED') 
        as rented_units
      `),

        this.db.raw(`
        COUNT(*) FILTER (WHERE iu.status = 'SOLD') 
        as sold_units
      `),

        this.db.raw(`
        COUNT(*) FILTER (WHERE iu.status = 'IN_TRANSIT') 
        as in_transit_units
      `),
        this.db.raw(`
            COUNT(*) FILTER (WHERE iu.status = 'RESERVED') 
            as reserved_units
          `),
        this.db.raw(`
        COUNT(*) FILTER (WHERE iu.status = 'CREATED') 
        as without_location
      `),
      )
      .first();

    return stats;
  }

  async getStatsByUsers() {
    const db = this.db;

    return db('persons as p')
      .join('users as u', 'u.person_id', 'p.id')
      .join('location_members as lm', 'lm.user_id', 'u.id')
      .join('locations as l', 'l.id', 'lm.location_id')
      .join('item_units as iu', 'iu.location_id', 'l.id')

      .select(
        'p.id as person_id',
        'p.name as person_name',
        'u.id as user_id',
        db.raw('COUNT(DISTINCT l.id) as total_locations'),
        db.raw('COUNT(iu.id) as total_units'),
      )
      .groupBy('p.id', 'p.name', 'u.id')
      .orderBy('p.name');
  }

  async getUsageLogs(id: Number) {
    const rows = await this.db('item_unit_usage_logs as ul')
      .join('requisitions as r', 'r.id', 'ul.requisition_id')
      .join('locations as l', 'r.destination_location_id', 'l.id')
      .where('ul.item_unit_id', id)
      .whereNotNull('ul.hours_used')
      .select('l.id as location_id', 'l.name as location_name')
      .sum('ul.hours_used as hours')
      .groupBy('l.id', 'l.name');

    const totalUsage = rows.reduce((sum, r) => sum + Number(r.hours), 0);

    const locations = rows.map((r) => ({
      location_id: r.location_id,
      location_name: r.location_name,
      hours: Number(r.hours),
      percentage: totalUsage
        ? Math.round((Number(r.hours) / totalUsage) * 100)
        : 0,
    }));
    return {
      total_usage: totalUsage,
      locations,
    };
  }

  async findByUser(personId: number) {
    const user = await this.usersServices.findByPersonId(personId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado para esta persona.');
    }

    const items = await this.db('item_units')
      .join(
        'location_members',
        'item_units.location_id',
        'location_members.location_id',
      )
      .join('items', 'item_units.item_id', 'items.id')
      .select(
        'item_units.*',
        'items.name',
        'items.brand',
        'items.model',
        'items.type',
        'items.tracking',
      )
      .where('location_members.user_id', user.id);
    return items;
  }
}

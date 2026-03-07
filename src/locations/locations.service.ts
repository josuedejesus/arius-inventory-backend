import { Inject, Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { LocationMembersService } from 'src/location_members/location_members.service';
import { LocationViewModel } from './dto/location-view-model';

@Injectable()
export class LocationsService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    private readonly locationMembersService: LocationMembersService,
  ) {}

  async findAll(filters?: { userId?: string }) {
    const query = this.db('locations').orderBy('locations.name', 'asc');

    if (filters?.userId) {
      query
        .join(
          'location_members',
          'location_members.location_id',
          'locations.id',
        )
        .select('locations.*')
        .where('location_members.user_id', filters.userId)
        .distinct();
    }

    return await query;
  }

  async getLocationsWithInventory() {
    return this.db('locations as l')
      .leftJoin('stock_moves as sm', function () {
        this.on('sm.destination_location_id', '=', 'l.id').orOn(
          'sm.source_location_id',
          '=',
          'l.id',
        );
      })
      .select(
        'l.id',
        'l.name',
        'l.type',
        'l.location',
        'l.is_active',
        'l.updated_at',

        // total_items
        this.db.raw(`
        COUNT(DISTINCT sm.item_id)
        FILTER (
          WHERE sm.destination_location_id = l.id
             OR sm.source_location_id = l.id
        )
        AS total_items
      `),

        // total_stock
        this.db.raw(`
        COALESCE(
          SUM(
            CASE
              WHEN sm.destination_location_id = l.id
              THEN sm.quantity
              ELSE 0
            END
          ), 0
        ) -
        COALESCE(
          SUM(
            CASE
              WHEN sm.source_location_id = l.id
              THEN sm.quantity
              ELSE 0
            END
          ), 0
        )
        AS total_stock
      `),

        // last_movement_at
        this.db.raw(`
        MAX(sm.executed_at) AS last_movement_at
      `),
      )
      .groupBy(
        'l.id',
        'l.name',
        'l.type',
        'l.location',
        'l.is_active',
        'l.updated_at',
      )
      .orderBy('l.name', 'asc');
  }

  async findById(id: string, trx: any = null): Promise<LocationViewModel> {
    const db = trx || this.db;

    const location = await db('locations')
      .where({
        id: id,
      })
      .first();

    return new LocationViewModel({
      id: location.id,
      name: location.name,
      type: location.type,
      location: location.location,
      is_active: location.is_active,
      created_at: location.created_at,
      updated_at: location.updated_at,
    });
  }

  async create(dto: CreateLocationDto) {
    return this.db.transaction(async (trx: any) => {
      const [location] = await trx('locations')
        .insert({
          name: dto.name,
          type: dto.type,
          location: dto.location,
          is_active: dto.is_active,
        })
        .returning('*');

      if (dto.location_members) {
        const members = dto.location_members.map((m) => ({
          location_id: location.id,
          user_id: m.id,
          is_active: true,
        }));
        await this.locationMembersService.createMany(members, trx);
      }

      return {
        name: location.name,
      };
    });
  }

  async update(locationId: number, dto: UpdateLocationDto) {
    return this.db.transaction(async (trx: any) => {
      await trx('locations')
        .where({
          id: locationId,
        })
        .update({
          name: dto.name,
          type: dto.type,
          location: dto.location,
          is_active: dto.is_active,
          updated_at: new Date(),
        });

      const existingMembers =
        await this.locationMembersService.getByLocationId(locationId);

      const incomingIds = new Set(dto.location_members.map((m) => m.id));

      const existingIds = new Set(existingMembers.map((m) => m.id));

      const toAdd = dto.location_members.filter((m) => !existingIds.has(m.id));

      const toRemove = existingMembers
        .filter((m: any) => !incomingIds.has(m.id))
        .map((m: any) => m.id);

      const toAddMapped = toAdd.map((m) => ({
        location_id: locationId,
        user_id: m.id,
        is_active: true,
      }));

      if (toAddMapped.length) {
        await this.locationMembersService.createMany(toAddMapped, trx);
      }

      if (toRemove.length) {
        await this.locationMembersService.removeMany(locationId, toRemove, trx);
      }

      return {
        name: dto.name,
      };
    });
  }

  async findByUser(userId: number) {
    return this.db('locations')
      .join('location_members', 'location_members.location_id', 'locations.id')
      .join('users', 'users.id', 'location_members.user_id')
      .select('locations.*')
      .where('users.id', userId);
  }

  async getStats() {
    const rows = await this.db('locations as l')
      .join('item_units as iu', 'iu.location_id', 'l.id')
      .select(
        'l.id',
        'l.name',
        'l.type',
        this.db.raw('COUNT(iu.id) as total_units'),
      )
      .groupBy('l.id', 'l.name', 'l.type')
      .orderBy(['l.type', { column: 'total_units', order: 'desc' }]);

    return {
      active_locations: rows.length,
      locations: rows,
    };
  }
}

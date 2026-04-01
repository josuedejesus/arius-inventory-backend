import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class LocationMembersService {
  constructor(@Inject('KNEX') private readonly db: any) {}

  async createMany(data: any[], trx: any = []) {
    data;
    const db = trx || this.db;
    return db('location_members').insert(data).returning('*');
  }

  async removeMany(locationId: number, usersIds: number[], trx: any) {
    return trx('location_members')
      .where('location_id', locationId)
      .whereIn('user_id', usersIds)
      .del();
  }

  async removeManyByUser(userId: number, locationIds: number[], trx: any) {
    return trx('location_members')
      .where('user_id', userId)
      .whereIn('location_id', locationIds)
      .del();
  }

  async getByLocationId(locationId: number) {
    return this.db('location_members')
      .join('users', 'location_members.user_id', 'users.id')
      .join('persons', 'users.person_id', 'persons.id')
      .where({
        location_id: locationId,
      })
      .select('users.id', 'persons.name');
  }

  async getByUserId(userId: number) {
    return this.db('location_members')
      .join('users', 'location_members.user_id', 'users.id')
      .join('locations', 'location_members.location_id', 'locations.id')
      .where({
        'users.id': userId,
      })
      .select('locations.*');
  }
}

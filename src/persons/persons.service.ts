import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LocationsService } from 'src/locations/locations.service';
import { LocationMembersService } from 'src/location_members/location_members.service';

@Injectable()
export class PersonsService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private locationsService: LocationsService,
    private locationMembersService: LocationMembersService,
  ) {}

  async create(dto: CreatePersonDto) {
    try {
      return await this.db.transaction(async (trx: any) => {
        // 🔹 INSERT PERSON
        const [person] = await trx('persons')
          .insert({
            name: dto.name,
            phone: dto.phone,
            email: dto.email,
            role: dto.role,
            address: dto.address,
            rtn: dto.rtn,
            created_at: new Date(),
          })
          .returning('*');

        let user = null;

        // 🔹 CREATE USER
        if (dto.user) {
          const passwordHash = await bcrypt.hash(dto.user.password, 10);

          const [user] = await trx('users')
            .insert({
              username: dto.user.username,
              password_hash: passwordHash,
              role: dto.user.role,
              is_active: true,
              person_id: person.id,
              created_at: new Date(),
            })
            .returning('*');

          if (dto.locations?.length) {
            const locationsToCreate = dto.locations.map((locationId: any) => ({
              user_id: user.id, // ✅ aquí sí existe
              location_id: Number(locationId),
            }));

            await trx('location_members').insert(locationsToCreate);
          }
        }

        return { id: person.id };
      });
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          'Ya existe un usuario con ese correo o teléfono.',
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdatePersonDto) {
    try {
      return await this.db.transaction(async (trx: any) => {
        const [person] = await trx('persons')
          .where({ id })
          .update({
            name: dto.name,
            phone: dto.phone,
            email: dto.email,
            role: dto.role,
            address: dto.address,
            rtn: dto.rtn,
            updated_at: new Date(),
          })
          .returning('*');

        const user = await trx('users').where({ person_id: id }).first();

        if (user) {
          const updateData: any = {
            username: dto.user?.username || user.username,
            is_active: dto.user?.is_active ?? user.is_active,
            role: dto.user?.role || user.role,
          };

          if (dto.user?.password?.length) {
            updateData.password_hash = await bcrypt.hash(dto.user.password, 10);
          }

          await trx('users').where({ id: user.id }).update(updateData);

          if (dto.locations) {
            const userLocations = await trx('location_members')
              .where({ user_id: user.id })
              .select('location_id');

            const existingIds = userLocations.map((l: any) =>
              Number(l.location_id),
            );

            const incomingLocations = dto.locations.map((id: any) =>
              Number(id),
            );

            const incomingIds = incomingLocations.filter(
              (id: number) => !existingIds.includes(id),
            );

            const deletedIds = existingIds.filter(
              (id: number) => !incomingLocations.includes(id),
            );

            if (incomingIds.length > 0) {
              const locationsToCreate = incomingIds.map(
                (locationId: number) => ({
                  user_id: user.id,
                  location_id: locationId,
                }),
              );

              await trx('location_members').insert(locationsToCreate);
            }

            if (deletedIds.length > 0) {
              await trx('location_members')
                .where({ user_id: user.id })
                .whereIn('location_id', deletedIds)
                .del();
            }
          }
        } else {
          if (dto.user) {
            const passwordHash = await bcrypt.hash(dto.user.password, 10);

            const [newUser] = await trx('users')
              .insert({
                username: dto.user.username,
                password_hash: passwordHash,
                role: dto.user.role,
                is_active: true,
                person_id: person.id,
              })
              .returning('*');

            // 🔹 INSERT LOCATIONS SI VIENEN
            if (dto.locations?.length) {
              const locationsToCreate = dto.locations.map(
                (locationId: number) => ({
                  user_id: newUser.id,
                  location_id: locationId,
                }),
              );

              await trx('location_members').insert(locationsToCreate);
            }
          }
        }

        return true;
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('Datos duplicados.');
      }

      throw error;
    }
  }

  async findAll(query: any) {
    const qb = this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.user', 'user');

    if (query.locationId) {
      qb.innerJoin('location_members', 'lm', 'lm.user_id = user.id').andWhere(
        'lm.location_id = :locationId',
        { locationId: Number(query.locationId) },
      );
    }

    return qb
      .select([
        'person.id AS id',
        'person.name AS name',
        'person.phone AS phone',
        'person.email AS email',
        'person.role AS role',
        'person.address AS address',
        'person.rtn AS rtn',
        'person.created_at AS created_at',
        'person.updated_at AS updated_at',
        'user.id AS user_id',
        'user.username AS username',
        'user.role AS user_role',
      ])
      .addSelect(
        (sub) =>
          sub
            .select('COUNT(lm2.location_id)', 'location_count')
            .from('location_members', 'lm2')
            .where('lm2.user_id = user.id'),
        'location_count',
      )
      .orderBy('person.name', 'ASC')
      .getRawMany();
  }

  async findById(id: any, trx: any = null) {
    const db = trx || this.db;

    return db('persons').where({ id }).first();
  }

  async getLocations(id: number) {
    const user = await this.userRepository.findOne({
      where: { person: { id } },
      relations: ['person'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado para esta persona.');
    }

    const locations = await this.db('locations')
      .join('location_members', 'locations.id', 'location_members.location_id')
      .where('location_members.user_id', user.id);

    return locations;
  }
}

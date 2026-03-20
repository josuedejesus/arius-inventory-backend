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

@Injectable()
export class PersonsService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreatePersonDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const person = manager.create(Person, {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          role: dto.role,
          address: dto.address,
          rtn: dto.rtn,
        });

        await manager.save(person);

        if (dto.user) {
          const passwordHash = await bcrypt.hash(dto.user.password, 10);
          console.log('person', person);
          console.log('Creating user:', dto.user);

          const user = manager.create(User, {
            username: dto.user.username,
            password_hash: passwordHash,
            role: dto.user.role,
            is_active: true,
            person: person,
          });
          await manager.save(user);
        }

        return { id: person.id };
      });
    } catch (error: any) {
      console.log(error);
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
      const person = await this.personRepository.save({
        id,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        role: dto.role,
        address: dto.address,
        rtn: dto.rtn,
        updated_at: new Date(),
      });
    } catch (error: any) {
      if (error?.code === '23505' || error?.driverError?.code === '23505') {
        throw new ConflictException('Datos duplicados.');
      }

      throw error;
    }
  }

  async findAll() {
    return this.personRepository
      .createQueryBuilder('person')
      .leftJoin('person.user', 'user')
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

  async getItems(id: number) {
    const user = await this.userRepository.findOne({
      where: { person: { id } },
      relations: ['person'],
    });

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

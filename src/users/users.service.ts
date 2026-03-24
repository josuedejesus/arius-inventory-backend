import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { IsNull, Repository } from 'typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateUserDTO) {
    try {
      const passwordHash = await bcrypt.hash(dto.password, 10);

      const user = this.userRepository.create({
        username: dto.username,
        password_hash: passwordHash,
        role: dto.role,
        is_active: true,
      });

      await this.userRepository.save(user);

      return { id: user.id };
    } catch (error: any) {
      if (error?.code === '23505' || error?.driverError?.code === '23505') {
        throw new ConflictException('Ya existe el usuario.');
      }

      throw error;
    }
  }

  async update(id: number, dto: UpdateUserDto) {
    try {
      const updateData: any = {
        username: dto.username,
        is_active: dto.is_active,
        role: dto.role,
      };

      if (dto.password?.length) {
        updateData.password_hash = await bcrypt.hash(dto.password, 10);
      }

      const user = await this.userRepository.preload({
        id: id,
        ...updateData,
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return await this.userRepository.save(user);
    } catch (error: any) {
      if (error?.code === '23505' || error?.driverError?.code === '23505') {
        throw new ConflictException('El username ya existe.');
      }

      throw error;
    }
  }

  async findAll() {
    return this.userRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findAllWithProfile() {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.person', 'person')
      .select(['user.id', 'user.username', 'user.role', 'person.name'])
      .orderBy('person.name', 'ASC')
      .getMany();

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.person?.name ?? null,
    }));
  }

  async findAvailable() {
    return await this.userRepository.find({
      where: {
        person: IsNull(),
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
      order: {
        username: 'ASC',
      },
    });
  }

  async findByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async findById(id: string, trx: any = null) {
    const db = trx || this.db;

    return db('users').where({ id }).first();
  }

  async findByPersonId(id: number) {
    return this.userRepository.findOne({
      where: { person_id: id },
      select: {
        id: true,
        username: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });
  }
}

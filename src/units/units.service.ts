import { Inject, Injectable } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(@Inject('KNEX') private readonly db: any) {}

  async createUnit(dto: CreateUnitDto) {
    const [unit] = await this.db('units').insert(dto).returning('*');

    return unit;
  }

  async getUnits() {
    return this.db('units').orderBy('name', 'asc');
  }

  async update(id: number, dto: UpdateUnitDto) {
    await this.db('units')
      .where({
        id: id,
      })
      .update(dto);
    return dto;
  }

  async findById(id: number) {
    const unit = await this.db('units')
      .where({
        id,
      })
      .first();

    return unit;
  }
}

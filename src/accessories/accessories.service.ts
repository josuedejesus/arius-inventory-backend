import { Inject, Injectable } from '@nestjs/common';
import { CreateAccessoryDto } from './dto/create-accessory.dto';

@Injectable()
export class AccessoriesService {
    constructor(
        @Inject('KNEX') private readonly db: any
    ) {}

    async getAccesories() {
        return this.db('accessories')
        .orderBy('name', 'asc');
    }

    async createAccesoryDto(dto: CreateAccessoryDto) {
        const [accessory] = await this.db('accessories')
        .insert(dto)
        .returning('*');

        return accessory;
    }
}

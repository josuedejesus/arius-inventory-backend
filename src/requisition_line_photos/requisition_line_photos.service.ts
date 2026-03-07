import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PersonsService } from 'src/persons/persons.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RequisitionLinePhotosService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    private readonly usersService: UsersService,
    private readonly personsService: PersonsService,
  ) {}

  async createMany(requisitionLineId: string, personId: string, files: any[]) {
    const rows = files.map((file) => ({
      requisition_line_id: requisitionLineId,
      image_path: `item-units/${file.filename}`,
      taken_by: personId,
    }));

    await this.db('requisition_line_photos').insert(rows);

    return true;
  }

  async findByRequisitionLineId(requisitionLineId: string) {
    return this.db('requisition_line_photos')
      .where({
        requisition_line_id: requisitionLineId,
      })
      .orderBy('id', 'asc');
  }
}

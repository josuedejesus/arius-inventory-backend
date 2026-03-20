import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class RequisitionLinePhotosService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    private readonly s3Service: S3Service,
  ) {}

  async createMany(
    requisitionLineId: string,
    personId: string,
    files: Express.Multer.File[],
  ) {
    const rows = await Promise.all(
      files.map(async (file) => {
        const imageUrl = await this.s3Service.uploadFile(file, 'line-photos');

        return {
          requisition_line_id: requisitionLineId,
          image_path: imageUrl,
          taken_by: personId,
        };
      }),
    );

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

import { Module } from '@nestjs/common';
import { RequisitionLinePhotosController } from './requisition_line_photos.controller';
import { RequisitionLinePhotosService } from './requisition_line_photos.service';
import { DatabaseModule } from 'src/database/database.module';
import { UsersService } from 'src/users/users.service';
import { PersonsService } from 'src/persons/persons.service';
import { UsersModule } from 'src/users/users.module';
import { PersonsModule } from 'src/persons/persons.module';

@Module({
  controllers: [RequisitionLinePhotosController],
  providers: [RequisitionLinePhotosService],
  imports: [DatabaseModule, UsersModule, PersonsModule],
})
export class RequisitionLinePhotosModule {}

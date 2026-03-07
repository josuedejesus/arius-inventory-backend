import { Module } from '@nestjs/common';
import { RequisitionLinesController } from './requisition-lines.controller';
import { RequisitionLinesService } from './requisition-lines.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [RequisitionLinesController],
  providers: [RequisitionLinesService],
  imports: [DatabaseModule],
  exports: [RequisitionLinesService]
})
export class RequisitionLinesModule {}

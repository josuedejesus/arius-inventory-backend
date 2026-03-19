import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { RequisitionsModule } from 'src/requisitions/requisitions.module';
import { RequisitionLinesModule } from 'src/requisition-lines/requisition-lines.module';

@Module({
  controllers: [PdfController],
  providers: [PdfService],
  imports: [RequisitionsModule, RequisitionLinesModule],
})
export class PdfModule {}

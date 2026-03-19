import { Controller, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get(':id/requisition')
  async generate(@Param('id') id: number, @Res() res: Response) {
    const pdf = await this.pdfService.generateRequisitionPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=requisition-${id}.pdf`,
    });

    res.send(pdf);
  }
}

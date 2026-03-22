import { Injectable } from '@nestjs/common';

import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { RequisitionLinesService } from 'src/requisition-lines/requisition-lines.service';
import { RequisitionsService } from 'src/requisitions/requisitions.service';
import { requisitionTemplate } from './templates/requisition.template';

@Injectable()
export class PdfService {
  constructor(
    private readonly requisitionService: RequisitionsService,
    private readonly requisitionLinesService: RequisitionLinesService,
  ) {}
  async generateRequisitionPdf(id: number): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const logoPath = path.join(process.cwd(), 'src/pdf/assets/logo.png');
    const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });

    const logoSrc = `data:image/png;base64,${logoBase64}`;

    const requisition = await this.requisitionService.findById(id);

    const lines = await this.requisitionLinesService.findByRequisitionId(id);


    const page = await browser.newPage();

    const data = {
      ...requisition,
      items: lines,
      logo: logoSrc,
      companyName: 'Arius',
    };

    const html = requisitionTemplate(data);

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    return Buffer.from(pdf);
  }
}

import { Body, Controller, Get, Param } from '@nestjs/common';
import { RequisitionLinesService } from './requisition-lines.service';

@Controller('requisition-lines')
export class RequisitionLinesController {
  constructor(
    private readonly requisitionLinesService: RequisitionLinesService,
  ) {}

  @Get('get-not-returned-by-location/:locationId')
  async getNotReturned(@Param('locationId') locationId: string) {
    const lines =
      await this.requisitionLinesService.getNotReturnedByLocation(locationId);

    return {
      success: true,
      data: lines,
    };
  }

  @Get('get-return-status/:requisitionId')
  async getReturnStatus(@Param('requisitionId') requisitionId: string) {
    const hasReturned =
      await this.requisitionLinesService.getReturnStatus(requisitionId);

    return {
      success: true,
      data: hasReturned,
    };
  }

  @Get('to-send')
  async getToSend() {
    const lines = await this.requisitionLinesService.getToSend();
    console.log('Lines to send', lines);
    return lines;
  }

  @Get(':requisitionId/requisition')
  async FindByRequisitionId(@Param('requisitionId') requisitionId: string) {
    const lines = await this.requisitionLinesService.findByRequisitionId(
      Number(requisitionId),
    );

    return lines;
  }
}

import { Injectable } from '@nestjs/common';
import { RequisitionType } from '../enums/requisition-type';
import { RentHandler } from './rent.handler';
import { ReturnHandler } from './return.handler';
import { AdjustmentHandler } from './adjustment.handler';
import { InternalTransferHandler } from './internal-transfer.handler';
import { PurchaseReceiptHandler } from './purchase-receipt';
import { RequisitionHandler } from './requisition-handler.interface';

@Injectable()
export class RequisitionHandlerFactory {
  constructor(
    private readonly rentHandler: RentHandler,
    private readonly returnHandler: ReturnHandler,
    private readonly adjustmentHandler: AdjustmentHandler,
    private readonly internalTransferHandler: InternalTransferHandler,
    private readonly purchaseReceiptHandler: PurchaseReceiptHandler,
  ) {}

  get(type: RequisitionType): RequisitionHandler {
    switch (type) {
      case RequisitionType.RENT:
        return this.rentHandler;
      case RequisitionType.RETURN:
        return this.returnHandler;
      case RequisitionType.ADJUSTMENT:
        return this.adjustmentHandler;
      case RequisitionType.INTERNAL_TRANSFER:
        return this.internalTransferHandler;
      case RequisitionType.PURCHASE_RECEIPT:
        return this.purchaseReceiptHandler;
      default:
        throw new Error(`Tipo no soportado: ${type}`);
    }
  }
}

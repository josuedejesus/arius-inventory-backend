export interface RequisitionHandler {
  approve?(requisition: any, personId: string, trx: any): Promise<void>;

  execute?(requisition: any, personId: string, trx: any): Promise<void>;

  receive?(requisition: any, personId: string, trx: any): Promise<void>;
}

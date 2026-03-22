import { ItemUnitStatus } from 'src/item-units/enums/item-unit-status.enum';
import { RequisitionType } from './enums/requisition-type';

// helpers/requisition-status.helper.ts
export function getStatusAfterReceive(
  requisitionType: RequisitionType,
  destinationLocationId: string,
  destinationLocationType: string,
): { status: ItemUnitStatus; location_id: string | null } {
  const toWarehouse = {
    status: ItemUnitStatus.AVAILABLE,
    location_id: destinationLocationId,
  };
  const toProject = {
    status: ItemUnitStatus.RENTED,
    location_id: destinationLocationId,
  };
  const byDestType =
    destinationLocationType === 'WAREHOUSE' ? toWarehouse : toProject;

  const map: Record<
    RequisitionType,
    { status: ItemUnitStatus; location_id: string | null }
  > = {
    
    [RequisitionType.OUT_OF_SERVICE]: {
      status: ItemUnitStatus.OUT_OF_SERVICE,
      location_id: null,
    },
    
    [RequisitionType.RETURN]: toWarehouse,
    [RequisitionType.PURCHASE_RECEIPT]: toWarehouse,
    [RequisitionType.ADJUSTMENT]: toWarehouse,
    [RequisitionType.RENT]: toProject,
    [RequisitionType.CONSUMPTION]: toProject,
    [RequisitionType.TRANSFER]: byDestType,
    [RequisitionType.INTERNAL_TRANSFER]: byDestType,
    [RequisitionType.SALE]: byDestType,
    [RequisitionType.MAINTENANCE]: byDestType,
  };

  return map[requisitionType] ?? byDestType;
};

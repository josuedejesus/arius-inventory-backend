// helpers/catalog-filter.helper.ts

import { ItemUnitStatus } from 'src/item-units/enums/item-unit-status.enum';
import { LocationType } from 'src/locations/types/location-type';
import { PersonRole } from 'src/persons/enums/person-role.enum';
import { MovementType } from 'src/requisitions/enums/movement-type';
import { RequisitionType } from 'src/requisitions/enums/requisition-type';

export type CatalogFilter = {
  itemUnits?:
    | {
        status?: ItemUnitStatus | ItemUnitStatus[];
        locationType?: LocationType;
        locationIds?: number[]; // para EXTERNAL
      }
    | false; // false = no cargar item_units
  supplies?:
    | {
        locationType?: LocationType;
        locationIds?: number[];
        unlimited?: boolean; // true = sin límite de stock (PURCHASE_RECEIPT, ADJUSTMENT)
        ignoreLocation?: boolean; // true = no filtrar por ubicación (PURCHASE_RECEIPT, ADJUSTMENT)
      }
    | false; // false = no cargar supplies
};

const getCatalogFilter = (
  movement: MovementType,
  type: RequisitionType,
  role: PersonRole,
  assignedLocationIds: number[],
): CatalogFilter => {
  const isExternal = role === PersonRole.CLIENT;

  // Restricción base por rol
  const locationRestriction = isExternal
    ? { locationIds: assignedLocationIds }
    : {};

  // ─── IN ───────────────────────────────────────────
  if (movement === MovementType.IN) {
    switch (type) {
      case RequisitionType.PURCHASE_RECEIPT:
      case RequisitionType.ADJUSTMENT:
        return {
          itemUnits: { ...locationRestriction, status: ItemUnitStatus.CREATED },
          supplies: {
            ...locationRestriction,
            unlimited: true,
            ignoreLocation: true,
          },
        };

      case RequisitionType.RETURN:
        return {
          itemUnits: { ...locationRestriction, status: ItemUnitStatus.RENTED },
          supplies: {
            ...locationRestriction,
            locationType: LocationType.PROJECT,
          },
        };

      case RequisitionType.MAINTENANCE:
        return {
          itemUnits: {
            ...locationRestriction,
            status: ItemUnitStatus.MAINTENANCE,
          },
          supplies: false,
        };

      default:
        return { itemUnits: false, supplies: false };
    }
  }

  // ─── OUT ──────────────────────────────────────────
  if (movement === MovementType.OUT) {
    switch (type) {
      case RequisitionType.SALE:
        return {
          itemUnits: {
            ...locationRestriction,
            status: ItemUnitStatus.AVAILABLE,
          },
          supplies: {
            ...locationRestriction,
            locationType: LocationType.WAREHOUSE,
          },
        };

      case RequisitionType.ADJUSTMENT:
        return {
          itemUnits: { ...locationRestriction, status: ItemUnitStatus.CREATED },
          supplies: {
            ...locationRestriction,
            locationType: LocationType.WAREHOUSE,
          },
        };

      case RequisitionType.MAINTENANCE:
        return {
          itemUnits: {
            ...locationRestriction,
            status: ItemUnitStatus.AVAILABLE,
          },
          supplies: false,
        };

      case RequisitionType.OUT_OF_SERVICE:
        return {
          itemUnits: {
            ...locationRestriction,
            status: ItemUnitStatus.AVAILABLE,
          },
          supplies: false,
        };

      case RequisitionType.RENT:
        return {
          itemUnits: {
            ...locationRestriction,
            status: ItemUnitStatus.AVAILABLE,
          },
          supplies: false,
        };

      case RequisitionType.CONSUMPTION:
        return {
          itemUnits: false,
          supplies: {
            ...locationRestriction,
            locationType: LocationType.WAREHOUSE,
          },
        };

      case RequisitionType.RETURN:
        return {
          itemUnits: { ...locationRestriction, status: ItemUnitStatus.RENTED },
          supplies: {
            ...locationRestriction,
            locationType: LocationType.PROJECT,
          },
        };
      case RequisitionType.TRANSFER:
        return {
          itemUnits: {
            ...locationRestriction,
            status: ItemUnitStatus.AVAILABLE,
          },
          supplies: {
            ...locationRestriction,
            locationType: LocationType.WAREHOUSE,
          },
        }

      default:
        return { itemUnits: false, supplies: false };
    }
  }

  // ─── INT ──────────────────────────────────────────
  if (movement === MovementType.INT) {
    switch (type) {
      case RequisitionType.INTERNAL_TRANSFER:
        return {
          itemUnits: {
            ...locationRestriction,
            status: ItemUnitStatus.AVAILABLE,
            locationType: LocationType.WAREHOUSE
          },
          supplies: {
            ...locationRestriction,
            locationType: LocationType.WAREHOUSE,
            unlimited: false
          }
        };
      default:
        return { itemUnits: false, supplies: false };
    }
  }

  // ─── EXT ──────────────────────────────────────────
  if (movement === MovementType.EXT) {
    switch (type) {
      case RequisitionType.TRANSFER:
        return {
          itemUnits: {
            ...locationRestriction,
            status: ItemUnitStatus.RENTED,
          },
          supplies: false,
        };

      default:
        return { itemUnits: false, supplies: false };
    }
  }

  return { itemUnits: false, supplies: false };
};

export { getCatalogFilter };

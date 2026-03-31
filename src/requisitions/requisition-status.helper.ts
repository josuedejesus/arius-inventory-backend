import { ItemUnitStatus } from 'src/item-units/enums/item-unit-status.enum';
import { RequisitionType } from './enums/requisition-type';
import { MovementType } from './enums/movement-type';

type Rule = {
  status?: ItemUnitStatus;
};

const movementRules: Record<
  RequisitionType,
  Record<MovementType, Rule>
> = {
  [RequisitionType.ADJUSTMENT]: {
    [MovementType.IN]: {
      status: ItemUnitStatus.AVAILABLE,
    },
    [MovementType.OUT]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.PURCHASE_RECEIPT]: {
    [MovementType.IN]: {
      status: ItemUnitStatus.AVAILABLE,
    },
    [MovementType.OUT]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.RETURN]: {
    [MovementType.IN]: {
      status: ItemUnitStatus.AVAILABLE,
    },
    [MovementType.OUT]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.RENT]: {
    [MovementType.OUT]: {
      status: ItemUnitStatus.RENTED,
    },
    [MovementType.IN]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.CONSUMPTION]: {
    [MovementType.OUT]: {},
    [MovementType.IN]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.TRANSFER]: {
    [MovementType.INT]: {
    },
    [MovementType.IN]: {},
    [MovementType.OUT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.INTERNAL_TRANSFER]: {
    [MovementType.INT]: {
      status: ItemUnitStatus.AVAILABLE,
    },
    [MovementType.IN]: {},
    [MovementType.OUT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.SALE]: {
    [MovementType.OUT]: {
      status: ItemUnitStatus.SOLD,
    },
    [MovementType.IN]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.MAINTENANCE]: {
    [MovementType.OUT]: {
      status: ItemUnitStatus.MAINTENANCE,
    },
    [MovementType.IN]: {
      status: ItemUnitStatus.AVAILABLE,
    },
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.OUT_OF_SERVICE]: {
    [MovementType.OUT]: {
      status: ItemUnitStatus.OUT_OF_SERVICE,
    },
    [MovementType.IN]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },
};

const cancelMovementRules: Record<
  RequisitionType,
  Record<MovementType, Rule>
> = {
  [RequisitionType.ADJUSTMENT]: {
    [MovementType.IN]: {
      status: ItemUnitStatus.CREATED,
    },
    [MovementType.OUT]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.PURCHASE_RECEIPT]: {
    [MovementType.IN]: {
      status: ItemUnitStatus.CREATED,
    },
    [MovementType.OUT]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.RETURN]: {
    [MovementType.IN]: {
      status: ItemUnitStatus.RENTED,
    },
    [MovementType.OUT]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.RENT]: {
    [MovementType.OUT]: {
      status: ItemUnitStatus.AVAILABLE,
    },
    [MovementType.IN]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.CONSUMPTION]: {
    [MovementType.OUT]: {},
    [MovementType.IN]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.TRANSFER]: {
    [MovementType.INT]: {
    },
    [MovementType.IN]: {},
    [MovementType.OUT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.INTERNAL_TRANSFER]: {
    [MovementType.INT]: {
      status: ItemUnitStatus.AVAILABLE,
    },
    [MovementType.IN]: {},
    [MovementType.OUT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.SALE]: {
    [MovementType.OUT]: {
      status: ItemUnitStatus.AVAILABLE,
    },
    [MovementType.IN]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.MAINTENANCE]: {
    [MovementType.OUT]: {
      status: ItemUnitStatus.AVAILABLE,
    },
    [MovementType.IN]: {
      status: ItemUnitStatus.MAINTENANCE,
    },
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },

  [RequisitionType.OUT_OF_SERVICE]: {
    [MovementType.OUT]: {
      status: ItemUnitStatus.AVAILABLE,
    },
    [MovementType.IN]: {},
    [MovementType.INT]: {},
    [MovementType.EXT]: {},
  },
};

export function getStatusAfterReceive(
  movementType: MovementType,
  requisitionType: RequisitionType,
): { status: ItemUnitStatus | undefined } {
  const rule = movementRules[requisitionType]?.[movementType];

  const status = rule?.status;

  return { status };
}

export function getCancelStatus(
  movementType: MovementType,
  requisitionType: RequisitionType
): { status: ItemUnitStatus | undefined } {
  const rule = cancelMovementRules[requisitionType]?.[movementType];

  const status = rule?.status;

  return { status };
}
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { LocationsService } from 'src/locations/locations.service';
import { PersonsService } from 'src/persons/persons.service';
import { UsersService } from 'src/users/users.service';
import { RequisitionLinesService } from 'src/requisition-lines/requisition-lines.service';
import { StockMovesService } from 'src/stock_moves/stock_moves.service';
import { ItemUnitsService } from 'src/item-units/item-units.service';
import { EventsService } from 'src/events/events.service';
import { ItemUnitUsageLogsService } from 'src/item_unit_usage_logs/item_unit_usage_logs.service';
import { createItemUnitUsageLogDto } from 'src/item_unit_usage_logs/dto/create-item-unit-usage-log.dto';
import { CreateReturnRequisitionDto } from './dto/create-return-requisition.dto';
import { RequisitionHandlerFactory } from './handlers/handler.factory';
import { RequisitionType } from './enums/requisition-type';
import { ItemUnitStatus } from 'src/item-units/enums/item-unit-status.enum';
import { RequisitionStatus } from './enums/requisition-status.enum';
import { RequisitionViewModel } from './dto/requisition-view-model';
import { UpdateRequisitionDto } from './dto/update-requisition.dto';
import { RequisitionLineViewModel } from 'src/requisition-lines/dto/requisition-line-view.model';
import { not } from 'rxjs/internal/util/not';
import { CreateRequisitionLineDto } from 'src/requisition-lines/dto/create-requisition-line.dto';
import { PagedRequestDto } from './dto/PaginationDto';
import { RequisitionFilterDto } from './dto/RequisitionFilterDto';

const LOCATIONS = {
  TRANSIT: 3,
  MAIN: 2,
  RECEPCION: 1,
  CONSUMED: 4,
  RENTED: 5,
  SOLD: 6,
};

type ActionType = 'CREATE' | 'EXECUTE' | 'RECEIVE' | 'APPROVE';

type ItemStatus = 'AVAILABLE' | 'IN_TRANSIT' | 'SOLD' | 'RENTED' | 'RESERVED';

const SOURCE_MAP: Record<
  RequisitionType,
  Partial<Record<ActionType, number>>
> = {
  INTERNAL_TRANSFER: {
    EXECUTE: LOCATIONS.TRANSIT,
  },
  ADJUSTMENT: {
    EXECUTE: LOCATIONS.MAIN,
  },
  PURCHASE_RECEIPT: {
    EXECUTE: LOCATIONS.MAIN,
  },
  RENT: {
    CREATE: LOCATIONS.MAIN,
    EXECUTE: LOCATIONS.TRANSIT,
  },
  RETURN: {
    CREATE: LOCATIONS.MAIN,
    EXECUTE: LOCATIONS.TRANSIT,
  },
  TRANSFER: {},
  SALE: {},
  CONSUMPTION: {},
};

const ITEM_STATUS_MAP: Record<
  RequisitionType,
  Partial<Record<ActionType, ItemStatus>>
> = {
  ADJUSTMENT: {
    APPROVE: 'RESERVED',
    EXECUTE: 'AVAILABLE',
  },
  PURCHASE_RECEIPT: {
    APPROVE: 'RESERVED',
    EXECUTE: 'AVAILABLE',
  },
  INTERNAL_TRANSFER: {
    APPROVE: 'RESERVED',
    EXECUTE: 'IN_TRANSIT',
    RECEIVE: 'AVAILABLE',
  },
  RENT: {
    APPROVE: 'RESERVED',
    EXECUTE: 'IN_TRANSIT',
    RECEIVE: 'RENTED',
  },
  RETURN: {
    APPROVE: 'RESERVED',
    EXECUTE: 'IN_TRANSIT',
    RECEIVE: 'AVAILABLE',
  },
  TRANSFER: {
    APPROVE: 'RESERVED',
    EXECUTE: 'IN_TRANSIT',
    RECEIVE: 'RENTED',
  },
  SALE: {},
  CONSUMPTION: {},
};

@Injectable()
export class RequisitionsService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    private readonly locationsService: LocationsService,
    private readonly personService: PersonsService,
    private readonly userService: UsersService,
    private readonly requisitionLinesService: RequisitionLinesService,
    private readonly stockMovesService: StockMovesService,
    private readonly itemUnitsService: ItemUnitsService,
    private readonly eventsService: EventsService,
    private readonly ItemUnitUsageLogsService: ItemUnitUsageLogsService,
    private readonly requisitionHandlerFactory: RequisitionHandlerFactory,
  ) {}

  async create(dto: CreateRequisitionDto) {
    return this.db.transaction(async (trx: any) => {
      const [requisition] = await trx('requisitions')
        .insert({
          requested_by: dto.requested_by,
          destination_location_id: dto.destination_location_id,
          status: dto.status,
          notes: dto.notes,
          type: dto.type,
          schedulled_at: dto.schedulled_at,
        })
        .returning('*');

      // líneas simples sin calcular source
      const lines = dto.lines.map((l: any) => ({
        requisition_id: requisition.id,
        item_id: l.item_id,
        item_unit_id: l.item_unit_id || null,
        quantity: l.quantity,
        destination_location_id: dto.destination_location_id,
        return_of_line_id: l.return_of_line_id || null,
        _accessories: l.accessories || [],
      }));

      const linesData = lines.map(({ _accessories, ...line }) => line);
      const createdLines = await this.requisitionLinesService.createMany(
        linesData,
        trx,
      );

      const lineAccessoriesPayload = createdLines.flatMap((line, index) => {
        return (lines[index]._accessories || []).map((acc: any) => ({
          requisition_line_id: Number(line.id),
          accessory_id: acc.accessory_id,
          quantity: acc.quantity,
        }));
      });

      if (lineAccessoriesPayload.length > 0) {
        await trx('requisition_line_accessories').insert(
          lineAccessoriesPayload,
        );
      }

      this.eventsService.emit('requisition.created', {
        requisitionId: requisition.id,
      });
      return requisition;
    });
  }

  async approve(requisitionId: number, personId: string) {
    return this.db.transaction(async (trx: any) => {
      const requisition = await trx('requisitions')
        .where({ id: requisitionId })
        .first();
      if (!requisition) throw new NotFoundException('Requisicion no existe');

      const lines = await this.requisitionLinesService.findByRequisitionId(
        requisition.id,
      );

      // resolvé y actualizá source por línea
      await Promise.all(
        lines.map(async (l: any) => {
          if (l.item_unit_id) {
            // unidad serializada — validá que esté en la ubicación correcta
            const unit = await trx('item_units')
              .where({ id: l.item_unit_id })
              .select('location_id')
              .first();
            if (!unit)
              throw new ConflictException(
                `Unidad ${l.item_unit_id} no encontrada`,
              );

            await trx('requisition_lines').where({ id: l.id }).update({
              source_location_id: unit.location_id,
            });
          } else {
            // insumo — calculá source con split
            const splits = await this.resolveSourceLocation(
              l.item_id,
              l.quantity,
              trx,
              requisition.destination_location_id,
            );

            // si hay split, la línea original se reemplaza por múltiples
            if (splits.length === 1) {
              await trx('requisition_lines').where({ id: l.id }).update({
                source_location_id: splits[0].source_location_id,
              });
            } else {
              // eliminá la línea original y creá las sub-líneas
              await trx('requisition_lines').where({ id: l.id }).delete();
              await this.requisitionLinesService.createMany(
                splits.map((s) => ({
                  requisition_id: requisitionId,
                  item_id: l.item_id,
                  item_unit_id: null,
                  quantity: s.quantity,
                  source_location_id: s.source_location_id,
                  destination_location_id: requisition.destination_location_id,
                })),
                trx,
              );
            }
          }
        }),
      );

      // reservá unidades serializadas
      const itemsUnits =
        await this.requisitionLinesService.findItemsByRequisitionId(
          requisition.id,
        );
      const itemUnitIds = itemsUnits.map((u: any) => u.id);

      if (itemUnitIds.length > 0) {
        await this.itemUnitsService.updateMany(
          itemUnitIds,
          {
            status: ItemUnitStatus.RESERVED,
            updated_at: new Date(),
          },
          trx,
        );
      }

      await trx('requisitions').where({ id: requisitionId }).update({
        status: 'APPROVED',
        approved_by: personId,
        approved_at: new Date(),
        updated_at: new Date(),
      });

      this.eventsService.emit('requisition.approved', { requisitionId });
      return { requisition_id: requisitionId };
    });
  }

  private async resolveSourceLocation(
    itemId: number,
    quantity: number,
    trx: any,
    destinationId?: number,
  ) {
    console.log('destinationId', destinationId);
    // si el destino es WAREHOUSE (compra, ajuste) no necesita source
    if (destinationId) {
      const destination = await trx('locations')
        .where({ id: destinationId })
        .select('type')
        .first();

      if (destination?.type === 'WAREHOUSE') {
        return [{ source_location_id: null, quantity: Number(quantity) }];
      }
    }
    const warehouses = await trx('locations')
      .where('locations.type', 'WAREHOUSE')
      .select(
        'locations.id as location_id',
        trx.raw(
          `
        COALESCE((
          SELECT SUM(quantity) FROM stock_moves
          WHERE item_id = ? AND destination_location_id = locations.id
        ), 0)
        -
        COALESCE((
          SELECT SUM(quantity) FROM stock_moves
          WHERE item_id = ? AND source_location_id = locations.id
        ), 0) AS available
      `,
          [itemId, itemId],
        ),
      )
      .orderBy('available', 'desc');

    // filtrás en JS — más simple y sin el problema de bindings
    const withStock = warehouses.filter((w: any) => Number(w.available) > 0);

    let remaining = Number(quantity);
    const sources: { source_location_id: number; quantity: number }[] = [];

    for (const wh of withStock) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, Number(wh.available));
      sources.push({ source_location_id: wh.location_id, quantity: take });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new ConflictException(
        `Stock insuficiente para el item ${itemId}. Faltan ${remaining} unidades.`,
      );
    }

    return sources;
  }

  async update(requisitionId: number, dto: UpdateRequisitionDto) {
    return this.db.transaction(async (trx: any) => {
      const requisition = await this.findById(requisitionId, trx);

      if (!requisition) {
        throw new NotFoundException('Requisición no encontrada');
      }

      await trx('requisitions')
        .where({
          id: requisitionId,
        })
        .update({
          requested_by: dto.requested_by,
          destination_location_id: dto.destination_location_id,
          status: dto.status,
          notes: dto.notes,
          type: dto.type,
          schedulled_at: dto.schedulled_at,
          updated_at: new Date(),
        });

      const existingLines: RequisitionLineViewModel[] =
        await this.requisitionLinesService.findByRequisitionId(
          requisitionId,
          trx,
        );

      const existingLinesIds = existingLines.map((l: any) => String(l.id));

      const linesToCreate = dto.lines.filter(
        (l: any) => !l.id || !existingLinesIds.includes(String(l.id)),
      );

      const linesToUpdate = dto.lines.filter(
        (l: any) => l.id && existingLinesIds.includes(String(l.id)),
      );
      const linesToDelete = existingLines.filter(
        (l: any) =>
          !dto.lines.some(
            (line: any) => line.id && Number(line.id) === Number(l.id),
          ),
      );

      console.log('lines to create', linesToCreate);
      console.log('lines to update', linesToUpdate);
      console.log('lines to delete', linesToDelete);

      await Promise.all([
        ...linesToCreate.map((line: any) =>
          this.requisitionLinesService.createMany(
            [
              {
                requisition_id: requisitionId,
                item_id: line.item_id,
                item_unit_id: line.item_unit_id || null,
                quantity: line.quantity,
                created_at: new Date(),
                return_of_line_id: line.return_of_line_id || null,
                source_location_id: line.source_location_id || null,
                destination_location_id: dto.destination_location_id,
              },
            ],
            trx,
          ),
        ),
        ...linesToUpdate.map((line: any) =>
          this.requisitionLinesService.updateMany(
            [
              {
                id: line.id,
                item_id: line.item_id,
                item_unit_id: line.item_unit_id || null,
                quantity: line.quantity,
                return_of_line_id: line.return_of_line_id || null,
                source_location_id: line.source_location_id || null,
                destination_location_id: dto.destination_location_id,
                updated_at: new Date(),
              },
            ],
            trx,
          ),
        ),
        ...linesToDelete.map((line: RequisitionLineViewModel) =>
          this.requisitionLinesService.updateMany(
            [{ id: line.id, deleted_at: new Date(), is_deleted: true }],
            trx,
          ),
        ),
      ]);

      this.eventsService.emit('requisition.updated', {
        requisitionId: requisitionId,
      });

      return true;
    });
  }

  async execute(requisitionId: number, personId: string) {
    return this.db.transaction(async (trx: any) => {
      const requisition = await this.db('requisitions')
        .where({
          id: requisitionId,
        })
        .first();

      if (!requisition) {
        throw new NotFoundException('La requisicion no existe');
      }

      const updateData: any = {
        status: RequisitionStatus.IN_PROGRESS,
        executed_at: new Date(),
        updated_at: new Date(),
      };

      const lines = await this.requisitionLinesService.findByRequisitionId(
        requisition.id,
      );

      const invalidLines = lines.filter(
        (l: any) => Number(l.photos_count) === 0,
      );

      if (invalidLines.length > 0) {
        throw new BadRequestException(
          'No se puede ejecutar la requisición: todos los artículos deben contar con evidencia fotográfica',
        );
      }

      //Update requisition
      await trx('requisitions')
        .where({
          id: requisitionId,
        })
        .update(updateData);

      const movements = lines.map((l) => ({
        requisition_id: requisition.id,
        item_id: l.item_id,
        item_unit_id: l.item_unit_id,
        quantity: l.quantity,
        source_location_id: l.source_location_id,
        destination_location_id: null,
        executed_by: personId,
        executed_at: new Date(),
      }));

      await this.stockMovesService.createMany(movements, trx);

      const itemsUnits =
        await this.requisitionLinesService.findItemsByRequisitionId(
          requisition.id,
        );

      const itemUnitIds = itemsUnits.map((u: any) => u.id);

      const itemUnitsPayload = {
        status: ItemUnitStatus.IN_TRANSIT,
        location_id: null,
        updated_at: new Date(),
      };

      await this.itemUnitsService.updateMany(
        itemUnitIds,
        itemUnitsPayload,
        trx,
      );

      this.eventsService.emit('requisition.executed', {
        requisitionId: requisitionId,
      });

      return true;
    });
  }

  async receive(requisitionId: number, personId: number) {
    return this.db.transaction(async (trx: any) => {
      const requisition = await trx('requisitions')
        .where({ id: requisitionId })
        .first();
      if (!requisition) throw new NotFoundException('La requisicion no existe');

      const lines = await this.requisitionLinesService.findByRequisitionId(
        requisition.id,
      );
      const itemsUnits =
        await this.requisitionLinesService.findItemsByRequisitionId(
          requisition.id,
        );
      const itemUnitIds = itemsUnits.map((u: any) => u.id);
      const receiptDate = new Date();

      // ── Location map ──────────────────────────────────────────────────────
      const allLocationIds = [
        ...new Set([
          ...lines.map((l: any) => l.destination_location_id),
          ...lines
            .filter((l: any) => l.source_location_id)
            .map((l: any) => l.source_location_id),
        ]),
      ];

      const locations = await trx('locations')
        .whereIn('id', allLocationIds)
        .select('id', 'type');
      const locationMap = Object.fromEntries(
        locations.map((l: any) => [l.id, l.type]),
      );

      // ── Update item units (status + location por línea) ───────────────────
      await Promise.all(
        lines
          .filter((l: any) => l.item_unit_id)
          .map((line: any) => {
            const destType = locationMap[line.destination_location_id];
            const status =
              destType === 'WAREHOUSE'
                ? ItemUnitStatus.AVAILABLE
                : ItemUnitStatus.RENTED;
            return this.itemUnitsService.updateMany(
              [line.item_unit_id],
              {
                status,
                location_id: line.destination_location_id,
                updated_at: receiptDate,
              },
              trx,
            );
          }),
      );

      // ── Stock moves ───────────────────────────────────────────────────────
      const movements = lines.map((l: any) => ({
        requisition_id: requisition.id,
        item_id: l.item_id,
        item_unit_id: l.item_unit_id,
        quantity: l.quantity,
        source_location_id: null,
        destination_location_id: l.destination_location_id,
        received_by: personId,
        received_at: receiptDate,
      }));
      await this.stockMovesService.createMany(movements, trx);

      // ── Usage logs ────────────────────────────────────────────────────────
      const linesFromProject = lines.filter(
        (l: any) => locationMap[l.source_location_id] === 'PROJECT',
      );
      if (linesFromProject.length > 0) {
        await this.closeUsageLogsFromParentLines(
          linesFromProject,
          itemUnitIds,
          receiptDate,
          trx,
        );
      }

      const linesToProject = lines.filter(
        (l: any) =>
          locationMap[l.destination_location_id] === 'PROJECT' &&
          l.item_unit_id,
      );
      if (linesToProject.length > 0) {
        await this.ItemUnitUsageLogsService.createMany(
          linesToProject.map((l: any) => ({
            item_unit_id: l.item_unit_id,
            requisition_id: requisitionId,
            start_at: receiptDate,
            created_at: receiptDate,
          })),
          trx,
        );
      }

      // ── Finish ────────────────────────────────────────────────────────────
      await trx('requisitions').where({ id: requisitionId }).update({
        status: 'DONE',
        updated_at: receiptDate,
        received_at: receiptDate,
      });

      this.eventsService.emit('requisition.received', { requisitionId });
      return true;
    });
  }

  async closeUsageLogsFromParentLines(lines, itemUnitIds, receiptDate, trx) {
    const parentLinesIds = [
      ...new Set(
        lines
          .filter((l) => l.return_of_line_id)
          .map((l) => l.return_of_line_id),
      ),
    ];

    if (!parentLinesIds.length) return;

    const parentRequisitionsIds = await trx('requisition_lines')
      .whereIn('id', parentLinesIds)
      .pluck('requisition_id');

    if (!parentRequisitionsIds.length) return;

    const units = await trx('item_units')
      .join('items', 'items.id', 'item_units.item_id')
      .select('item_units.id as item_unit_id', 'items.usage_hours')
      .whereIn('item_units.id', itemUnitIds);

    console.log('units', units);

    const usageMap = new Map(
      units.map((u) => [Number(u.item_unit_id), Number(u.usage_hours || 0)]),
    );

    console.log('usageMap', usageMap);

    const logs = await trx('item_unit_usage_logs')
      .whereIn('requisition_id', parentRequisitionsIds)
      .whereIn('item_unit_id', itemUnitIds)
      .whereNull('end_at');

    const logPayload = logs.map((log) => {
      const startDate = new Date(log.start_at);

      const diffDays =
        Math.floor(
          (receiptDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;

      console.log('log', log);
      const usagePerDay = usageMap.get(log.item_unit_id) || 0;

      console.log('uso por dia', usagePerDay);

      return {
        id: log.id,
        end_at: receiptDate,
        hours_used: diffDays * Number(usagePerDay),
      };
    });

    if (logPayload.length > 0) {
      await this.ItemUnitUsageLogsService.updateMany(logPayload, trx);
    }
  }

  async findAll(
    filters?: { personId?: string },
    pagination?: { skipCount?: number; maxResultCount?: number },
  ) {
    const { skipCount = 0, maxResultCount = 10 } = pagination || {};

    /* 🧠 BASE QUERY (SIN SELECT NI GROUP) */
    const baseQuery = this.db('requisitions as r')
      .join('persons as p', 'p.id', 'r.requested_by')

      .leftJoin(
        { source_location: 'locations' },
        'source_location.id',
        'r.source_location_id',
      )

      .join(
        { destination_location: 'locations' },
        'destination_location.id',
        'r.destination_location_id',
      )

      .leftJoin('requisition_lines as rl', function () {
        this.on('rl.requisition_id', '=', 'r.id').andOnNotNull(
          'rl.item_unit_id',
        );
      })

      .leftJoin('requisition_lines as rlr', 'rlr.return_of_line_id', 'rl.id')
      .leftJoin('requisitions as rr', 'rr.id', 'rlr.requisition_id');

    /* 🔎 FILTROS (UNA SOLA VEZ) */
    if (filters?.personId) {
      baseQuery.where('r.requested_by', filters.personId);
    }

    /* 🔢 COUNT CORRECTO */
    const totalResult = await baseQuery
      .clone()
      .clearSelect()
      .clearOrder()
      .countDistinct('r.id as total')
      .first();

    const total = Number(totalResult?.total || 0);

    /* 📊 QUERY PRINCIPAL */
    const query = baseQuery
      .clone()
      .groupBy(
        'r.id',
        'p.name',
        'source_location.name',
        'destination_location.name',
      )
      .select(
        'r.*',
        'p.name as requestor_name',
        'source_location.name as source_location_name',
        'destination_location.name as destination_location_name',

        this.db.raw('COUNT(DISTINCT rl.id) as total_units'),

        this.db.raw(`
        COUNT(DISTINCT CASE 
          WHEN rr.status = 'DONE' THEN rlr.id 
        END) as returned_units
      `),

        this.db.raw(`
        CASE
          WHEN r.type NOT IN ('RENT','TRANSFER') THEN NULL
          WHEN COUNT(DISTINCT CASE WHEN rr.status = 'DONE' THEN rlr.id END) = 0 THEN 'NONE'
          WHEN COUNT(DISTINCT CASE WHEN rr.status = 'DONE' THEN rlr.id END) = COUNT(DISTINCT rl.id) THEN 'FULL'
          ELSE 'PARTIAL'
        END as return_status
      `),
      )
      .orderBy('r.id', 'desc')
      .limit(maxResultCount)
      .offset(skipCount);

    const items = await query;

    /* 🎯 RESPONSE ESTÁNDAR */
    return {
      items,
      total,
    };
  }

  async findById(
    requisitionId: number,
    trx: any = null,
  ): Promise<RequisitionViewModel> {
    const db = trx || this.db;

    const requisition: RequisitionViewModel = await db('requisitions as r')
      .join('persons as p', 'p.id', 'r.requested_by')

      .leftJoin('persons as requestor', 'requestor.id', 'r.requested_by')
      .leftJoin('persons as approver', 'approver.id', 'r.approved_by')

      .join(
        'locations as destination',
        'destination.id',
        'r.destination_location_id',
      )

      // 🔥 MISMAS JOINS QUE findAll
      .leftJoin('requisition_lines as rl', function () {
        this.on('rl.requisition_id', '=', 'r.id').andOnNotNull(
          'rl.item_unit_id',
        );
      })
      .leftJoin('requisition_lines as rlr', 'rlr.return_of_line_id', 'rl.id')
      .leftJoin('requisitions as rr', 'rr.id', 'rlr.requisition_id')

      // 🔥 GROUP BY NECESARIO
      .groupBy(
        'r.id',
        'p.name',
        'destination.id',
        'destination.name',
        'destination.location',
        'requestor.name',
        'approver.name',
      )

      .select(
        'r.*',
        'p.name as requestor_name',

        'destination.id as destination_id',
        'destination.name as destination_location_name',
        'destination.location as destination_address',

        'requestor.name as requestor_name',
        'approver.name as approver_name',

        // 🔥 NUEVO
        db.raw('COUNT(DISTINCT rl.id) as total_units'),

        db.raw(`
        COUNT(DISTINCT CASE 
          WHEN rr.status = 'DONE' THEN rlr.id 
        END) as returned_units
      `),

        db.raw(`
        CASE
          WHEN r.type NOT IN ('RENT','TRANSFER') THEN NULL
          WHEN COUNT(DISTINCT CASE WHEN rr.status = 'DONE' THEN rlr.id END) = 0 THEN 'NONE'
          WHEN COUNT(DISTINCT CASE WHEN rr.status = 'DONE' THEN rlr.id END) = COUNT(DISTINCT rl.id) THEN 'FULL'
          ELSE 'PARTIAL'
        END as return_status
      `),
      )
      .where('r.id', requisitionId)
      .first();

    if (!requisition) {
      throw new NotFoundException('Requisición no encontrada');
    }

    return {
      ...requisition,
    };
  }

  async getManyByIds(ids: number[], trx: any = null) {
    const db = trx || this.db;

    return await db('requisitions').whereIn('id', ids);
  }

  async createReturnRequisition(
    dto: CreateReturnRequisitionDto,
    personId: string,
  ) {
    return this.db.transaction(async (trx: any) => {
      const { id } = dto;

      const requisition = await this.findById(Number(id));

      if (!requisition) {
        return new NotFoundException('Requisicion no entonctrada');
      }

      const requisitionLines =
        await this.requisitionLinesService.findByRequisitionId(Number(id));

      const requisitionPayload = {
        requested_by: personId,
        source_location_id: requisition.destination_location_id,
        destination_location_id: 2,
        type: 'RETURN',
        status: 'DRAFT',
        notes: '',
        return_of_id: requisition.id,
        schedulled_at: new Date(),
      };

      const [newRequisition] = await trx('requisitions')
        .insert(requisitionPayload)
        .returning('*');

      const requisitionLinesPayload = requisitionLines.map((l: any) => ({
        requisition_id: newRequisition.id,
        item_id: l.item_id,
        item_unit_id: l.item_unit_id,
        quantity: l.quantity,
        return_of_line_id: l.id,
        created_at: new Date(),
      }));

      await this.requisitionLinesService.createMany(
        requisitionLinesPayload,
        trx,
      );

      return {
        requisition_id: newRequisition.id,
      };
    });
  }

  async getCount() {
    return await this.db('requisitions').count('id as count').first();
  }
}

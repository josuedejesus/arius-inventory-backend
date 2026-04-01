import {
  BadRequestException,
  ConflictException,
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
import { CreateReturnRequisitionDto } from './dto/create-return-requisition.dto';
import { RequisitionHandlerFactory } from './handlers/handler.factory';
import { ItemUnitStatus } from 'src/item-units/enums/item-unit-status.enum';
import { RequisitionStatus } from './enums/requisition-status.enum';
import { RequisitionViewModel } from './dto/requisition-view-model';
import { UpdateRequisitionDto } from './dto/update-requisition.dto';
import { RequisitionLineViewModel } from 'src/requisition-lines/dto/requisition-line-view.model';
import {
  getCancelStatus,
  getStatusAfterReceive,
} from './requisition-status.helper';
import { RequisitionType } from './enums/requisition-type';
import { MovementType } from './enums/movement-type';
import { LocationType } from 'src/locations/types/location-type';

@Injectable()
export class RequisitionsService {
  constructor(
    @Inject('KNEX') private readonly db: any,
    private readonly requisitionLinesService: RequisitionLinesService,
    private readonly stockMovesService: StockMovesService,
    private readonly itemUnitsService: ItemUnitsService,
    private readonly eventsService: EventsService,
    private readonly ItemUnitUsageLogsService: ItemUnitUsageLogsService,
    private readonly locationsService: LocationsService,
  ) {}

  async create(dto: CreateRequisitionDto) {
    return this.db.transaction(async (trx: any) => {
      const [requisition] = await trx('requisitions')
        .insert({
          requested_by: dto.requested_by,
          destination_location_id: dto.destination_location_id,
          status: dto.status,
          notes: dto.notes,
          movement: dto.movement,
          type: dto.type,
          schedulled_at: dto.schedulled_at,
        })
        .returning('*');

      const lines = await Promise.all(
        dto.lines.map(async (l: any) => {
          let source_location_id = null;
          if (l.item_unit_id) {
            const itemUnit = await trx('item_units')
              .where({ id: l.item_unit_id })
              .first();

            if (!itemUnit) {
              throw new Error('Item unit no encontrado');
            }

            if (
              dto.type !== RequisitionType.PURCHASE_RECEIPT &&
              dto.type !== RequisitionType.ADJUSTMENT
            ) {
              if (!itemUnit.location_id) {
                throw new Error('El equipo no tiene ubicación asignada');
              }
            }

            source_location_id = itemUnit.location_id;
          } else {
            /*if (
              dto.type !== RequisitionType.PURCHASE_RECEIPT &&
              dto.type !== RequisitionType.ADJUSTMENT &&
              dto.type !== RequisitionType.CONSUMPTION
            ) {
              console.log('Validando requisición de tipo:', dto.type);
              if (!l.source_location_id) {
                throw new Error(
                  'Debe especificar ubicación origen para supplies',
                );
              }
            } else {
              if (dto.movement === MovementType.OUT) {
                if (!l.source_location_id) {
                  throw new Error(
                    'Debe especificar ubicación origen para supplies',
                  );
                }
                source_location_id = l.source_location_id;
                console.log(l.source_location_id);
              }
            }*/
            source_location_id = l.source_location_id;
          }

          return {
            requisition_id: requisition.id,
            item_id: l.item_id,
            item_unit_id: l.item_unit_id || null,
            quantity: l.quantity,
            source_location_id,
            destination_location_id: dto.destination_location_id,
            return_of_line_id: l.return_of_line_id || null,
            _accessories: l.accessories || [],
          };
        }),
      );

      console.log('Requisition lines to create:', lines);

      //throw new Error('Debugging - movement OUT');

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

      if (requisition.status !== RequisitionStatus.DRAFT)
        throw new BadRequestException('La requisición debe estar fue aprobada');

      const lines = await this.requisitionLinesService.findByRequisitionId(
        requisition.id,
      );

      await this.validateRequisitionLines(
        lines,
        requisition.type,
        requisition.status,
        trx,
      );

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

      //throw new ConflictException('Debugging');

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
      const requisition = await this.findById(requisitionId, trx);

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

      await this.validateRequisitionLines(
        lines,
        requisition.type,
        requisition.status,
        trx,
      );

      const invalidLines = lines.filter(
        (l: any) => Number(l.photos_count) === 0,
      );

      /*if (invalidLines.length > 0) {
        throw new BadRequestException(
          'No se puede ejecutar la requisición: todos los artículos deben contar con evidencia fotográfica',
        );
      }*/

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

      let location;
      if (requisition.destination_location_id) {
        location = await this.locationsService.findById(
          requisition.destination_location_id,
        );
      }

      await Promise.all(
        lines
          .filter((l: any) => l.item_unit_id)
          .map((line: any) => {
            /*const { status } = getStatusAfterReceive(
              requisition.movement,
              requisition.type,
            );*/

            let status;

            if (location) {
              status = this.resolveReceiveStatusByLocation(location.type);
            } else {
              status = this.resolveReceiveStatusByRequisitionType(
                requisition.type,
              );
            }
            console.log(status);

            //throw new NotFoundException('DEBUGGING');

            const destinationId = requisition.destination_location_id;

            return this.itemUnitsService.updateMany(
              [line.item_unit_id],
              {
                status,
                location_id: destinationId,
                updated_at: receiptDate,
              },
              trx,
            );
          }),
      );

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
            requisition_id: String(requisitionId),
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

  private resolveReceiveStatusByLocation(locationType: LocationType) {
    switch (locationType) {
      case LocationType.WAREHOUSE:
        return ItemUnitStatus.AVAILABLE;
      case LocationType.PROJECT:
        return ItemUnitStatus.RENTED;
      case LocationType.MAINTENANCE:
        return ItemUnitStatus.MAINTENANCE;
    }
  }

  private resolveReceiveStatusByRequisitionType(
    requisitionType: RequisitionType,
  ) {
    switch (requisitionType) {
      case RequisitionType.OUT_OF_SERVICE:
        return ItemUnitStatus.OUT_OF_SERVICE;
    }
  }

  async cancel(requisitionId: number, userId: number) {
    return this.db.transaction(async (trx: any) => {
      const requisition = await this.findById(requisitionId, trx);
      if (!requisition) throw new NotFoundException('La requisicion no existe');

      if (requisition.status === RequisitionStatus.DONE)
        throw new BadRequestException(
          'No se puede cancelar una requisición que ya fue recibida',
        );

      let requisitionPayload = {
        status: RequisitionStatus.CANCELLED,
        cancelled_by: userId,
      };

      if (![RequisitionStatus.DRAFT].includes(requisition.status)) {
        const { status } = getCancelStatus(
          requisition.movement,
          requisition.type,
        );

        const lines = await this.requisitionLinesService.findByRequisitionId(
          requisition.id,
        );

        //construir datos de articulos
        const itemUnitsPayload = lines
          .filter((l) => l.item_unit_id)
          .map((l) => ({
            item_unit_id: l.item_unit_id,
            status: status,
            location_id: l.source_location_id,
            updated_at: new Date(),
          }));

        //actualizar articulos
        await Promise.all(
          itemUnitsPayload.map((item) =>
            trx('item_units').where('id', item.item_unit_id).update({
              status: item.status,
              location_id: item.location_id,
              updated_at: item.updated_at,
            }),
          ),
        );
        if (
          ![RequisitionStatus.DRAFT, RequisitionStatus.APPROVED].includes(
            requisition.status,
          )
        ) {
          //revertir movimientos
          const stockMoves = await this.stockMovesService.findByRequisitionId(
            requisition.id,
          );

          const reversedStockMoves = stockMoves.map(({ id, ...sm }: any) => ({
            ...sm,
            source_location_id: sm.destination_location_id,
            destination_location_id: sm.source_location_id,
            reversed_from_id: id,
            executed_at: new Date(),
            received_at: new Date(),
          }));

          await this.stockMovesService.createMany(reversedStockMoves, trx);
        }
      }

      //actualizar requisicion
      await trx('requisitions').update(requisitionPayload).where({
        id: requisition.id,
      });
      this.eventsService.emit('requisition.cancelled', { requisitionId });
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

    const usageMap = new Map(
      units.map((u) => [Number(u.item_unit_id), Number(u.usage_hours || 0)]),
    );

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

      const usagePerDay = usageMap.get(log.item_unit_id) || 0;

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

  async validateRequisitionLines(
    lines: any[],
    type: RequisitionType,
    status: RequisitionStatus,
    trx: any,
  ) {
    await Promise.all(
      lines.map(async (l: any) => {
        // 🔷 ITEM UNIT
        if (l.item_unit_id) {
          const unit = await trx('item_units')
            .where({ id: l.item_unit_id })
            .select('location_id', 'status')
            .first();

          if (!unit) {
            throw new ConflictException(
              `Unidad ${l.item_unit_id} no encontrada`,
            );
          }

          if (status === RequisitionStatus.DRAFT) {
            if (unit.status === ItemUnitStatus.RESERVED) {
              throw new ConflictException('La unidad ya está reservada');
            }
          }

          if (unit.location_id !== l.source_location_id) {
            throw new ConflictException(
              'La unidad ya no está en la ubicación original',
            );
          }
        }

        // 🔷 SUPPLY
        else {
          if (
            type !== RequisitionType.ADJUSTMENT &&
            type !== RequisitionType.PURCHASE_RECEIPT
          ) {
            const stock = await this.itemUnitsService.calculateStock(
              l.item_id,
              l.source_location_id,
              l.unit_name,
              trx,
            );

            if (Number(stock.available) < Number(l.quantity)) {
              throw new ConflictException(
                `Stock insuficiente para item ${l.item_id} en ubicación ${l.source_location_id}`,
              );
            }
          }
        }
      }),
    );
  }

  async findAll(
    filters?: { personId?: string },
    pagination?: { skipCount?: number; maxResultCount?: number },
  ) {
    const { skipCount = 0, maxResultCount = 10 } = pagination || {};

    const baseQuery = this.db('requisitions as r')
      .join('persons as p', 'p.id', 'r.requested_by')
      .leftJoin(
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
      .leftJoin('requisitions as rr', 'rr.id', 'rlr.requisition_id')

      // 🔥 AQUÍ
      .whereNot('r.status', 'CANCELLED');

    if (filters?.personId) {
      baseQuery.where('r.requested_by', filters.personId);
    }

    const totalResult = await baseQuery
      .clone()
      .clearSelect()
      .clearOrder()
      .countDistinct('r.id as total')
      .first();

    const total = Number(totalResult?.total || 0);

    const query = baseQuery
      .clone()
      .groupBy('r.id', 'p.name', 'destination_location.name')
      .select(
        'r.*',
        'p.name as requestor_name',
        this.db.raw(`destination_location.name as destination_location_name`),

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

      .leftJoin(
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

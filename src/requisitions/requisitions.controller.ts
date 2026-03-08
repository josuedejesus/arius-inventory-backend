import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequisitionsService } from './requisitions.service';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreateReturnRequisitionDto } from './dto/create-return-requisition.dto';
import { UpdateRequisitionDto } from './dto/update-requisition.dto';

@Controller('requisitions')
export class RequisitionsController {
  constructor(private readonly requisitionsService: RequisitionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'ADMIN',
    'OPERATION_MANAGER',
    'WAREHOUSE_MANAGER',
    'CLIENT',
    'CONTRACTOR',
  )
  async create(@Body() dto: CreateRequisitionDto) {
    dto;
    const requisition = await this.requisitionsService.create(dto);

    return {
      success: true,
      message: `Requisicion creada exitosamente`,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATION_MANAGER', 'WAREHOUSE_MANAGER')
  async update(@Param('id') id: string, @Body() dto: UpdateRequisitionDto) {
    await this.requisitionsService.update(Number(id), dto);

    return true;
  }

  @Get(':requisitionId')
  async getRequisition(@Param('requisitionId') requisitionId: string) {
    const requisition = await this.requisitionsService.findById(
      Number(requisitionId),
    );

    return requisition;
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATION_MANAGER', 'WAREHOUSE_MANAGER')
  async approve(@Param('id') id: string, @Req() req: any) {
    const user = req.user;

    await this.requisitionsService.approve(Number(id), user.person_id);

    return {
      success: true,
      message: 'Requisicion aprobada existosamente.',
    };
  }

  @Post(':id/execute')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'OPERATION_MANAGER', 'WAREHOUSE_MANAGER')
  async execute(@Param('id') id: string, @Req() req) {
    const user = req.user;

    const result = await this.requisitionsService.execute(
      Number(id),
      user.person_id,
    );

    return {
      success: true,
      message: 'Movimientos realizados existosamente.',
    };
  }

  @Post(':id/receive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATION_MANAGER', 'WAREHOUSE_MANAGER')
  async receive(@Param('id') id: string, @Req() req: any) {
    const user = req.user;

    await this.requisitionsService.receive(Number(id), user.person_id);

    return {
      success: true,
      message: 'Movimientos realizados existosamente.',
    };
  }

  @Post('create-return-requisition')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'ADMIN',
    'OPERATION_MANAGER',
    'WAREHOUSE_MANAGER',
    'CLIENT',
    'CONTRACTOR',
  )
  async createReturn(@Body() dto: CreateReturnRequisitionDto, @Req() req: any) {
    const user = req.user;

    await this.requisitionsService.createReturnRequisition(dto, user.person_id);

    return {
      success: true,
      message: 'Requisicion de retorno creada exitosamente',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: any) {
    const user = req.user;

    const privilegedRoles = ['ADMIN', 'WAREHOUSE_MANAGER', 'OPERATION_MANAGER'];

    let requisitions = [];

    if (privilegedRoles.includes(user.role)) {
      requisitions = await this.requisitionsService.findAll();
    } else {
      requisitions = await this.requisitionsService.findAll({
        personId: user.person_id,
      });
    }

    return requisitions;
  }
}

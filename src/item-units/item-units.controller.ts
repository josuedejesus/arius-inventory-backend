import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateItemUnitDto } from './dto/create-item-unit.dto';
import { ItemUnitsService } from './item-units.service';
import { UpdateItemUnitDto } from './dto/update-item-unit.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/multer.config';
import multer from 'multer';
import { GetByTypeDto } from './dto/get-by-type.dto';
import { stat } from 'fs';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RequisitionType } from 'src/requisitions/enums/requisition-type';

@Controller('item-units')
export class ItemUnitsController {
  constructor(private readonly itemUnitsService: ItemUnitsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateItemUnitDto,
  ) {
    if (file) {
      dto.image_path = `item-units/${file.filename}`;
    }
    const itemUnit = await this.itemUnitsService.create(dto);

    return {
      success: true,
      message: `Unidad ${itemUnit.internal_code} creada exitosamente.`,
    };
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async updateItemUnit(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateItemUnitDto,
  ) {
    if (file) {
      dto.image_path = `item-units/${file.filename}`;
    }

    const item = await this.itemUnitsService.update(dto, id);

    return {
      success: true,
      message: `Unidad ${item.internal_code} actualizada exitosamente.`,
    };
  }

  @Get('location/:itemId')
  async getItemUnitsByLocation(
    @Param('itemId') itemId: string,
    @Query('location_id') locationId: string,
  ) {
    const data = locationId
      ? await this.itemUnitsService.getItemUnitsByLocation(itemId, locationId)
      : await this.itemUnitsService.getItemUnits(itemId);

    return {
      success: true,
      data: data,
    };
  }

  @Get('requisition-type/:itemId')
  async getItemUnitsByRequisitionType(
    @Param('itemId') itemId: string,
    @Query('location_id') locationId: string,
    @Query('requisition_type') requisitionType: string,
  ) {
    const units = await this.itemUnitsService.getItemUnitsByAvailability(
      itemId,
      requisitionType,
      locationId,
    );

    return {
      success: true,
      data: units,
    };
  }

  @Get('item/:itemId')
  async findByItemId(@Param('itemId') itemId: string) {
    const data = await this.itemUnitsService.findByItemId(itemId);

    return {
      success: true,
      data: data,
    };
  }

  @Get('get-by-location/:locationId')
  async findByLocation(@Param('locationId') locationId: string) {
    const items = await this.itemUnitsService.findByLocation(locationId);

    return {
      success: true,
      data: items,
    };
  }

  @Get('get-by-item/:itemId')
  async findByItem(@Param('itemId') itemId: string) {
    const items = await this.itemUnitsService.findById(itemId);

    return {
      success: true,
      data: items,
    };
  }

  @Get('get-by-requisition-type')
  @UseGuards(JwtAuthGuard)
  async findByRequisitionType(@Query() query: GetByTypeDto, @Req() req: any) {
    const user = req.user;
    const { requisitionType, destinationId } = query;

    const data = await this.itemUnitsService.findByRequisitionType(
      requisitionType,
      Number(destinationId),
      Number(user.sub),
    );

    return {
      success: true,
      data: data,
    };
  }

  @Get('/get-unit-stats/:unitId')
  async getUnitStats(@Param('unitId') unitdId: string) {
    const stats = await this.itemUnitsService.getUnitStats(unitdId);

    return {
      success: true,
      data: stats,
    };
  }

  @Get('/get-rent-item-accessories/:itemUnitId')
  async findRentItemAccessories(@Param('itemUnitId') itemUnitId: string) {
    const accessories =
      await this.itemUnitsService.findRentItemAccessories(itemUnitId);

    return {
      success: true,
      data: accessories,
    };
  }

  @Get(':id/get-by-status')
  async findByStatus(@Param('id', ParseIntPipe) id: number) {
    const item = await this.itemUnitsService.findByStatus(id);

    return {
      success: true,
      data: item,
    };
  }

  @Get('get-stats-by-users')
  async getStatsByUsers() {
    const stats = await this.itemUnitsService.getStatsByUsers();
    console.log(stats);
    return {
      data: stats,
    };
  }

  @Get('get-stats')
  async getStats() {
    const stats = await this.itemUnitsService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const item = await this.itemUnitsService.findById(id);

    return {
      succes: true,
      data: item,
    };
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('locationId') locationId?: number,
    @Query('requireLocation') requireLocation?: boolean,
    @Query('withoutLocation') withoutLocation?: boolean,
  ) {
    const itemUnits = await this.itemUnitsService.findAll({
      status,
      locationId,
      requireLocation,
      withoutLocation
    });

    return {
      success: true,
      data: itemUnits,
    };
  }
}

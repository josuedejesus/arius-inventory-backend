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
import multer from 'multer';
import { GetByTypeDto } from './dto/get-by-type.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { S3Service } from 'src/s3/s3.service';
import { ItemUnitFilterDto } from './dto/item-unit-filter.dto';

@Controller('item-units')
export class ItemUnitsController {
  constructor(
    private readonly itemUnitsService: ItemUnitsService,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.memoryStorage(),
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateItemUnitDto,
  ) {
    if (file) {
      const imageUrl = await this.s3Service.uploadFile(file, 'item-units');
      dto.image_path = imageUrl;
    }
    const itemUnit = await this.itemUnitsService.create(dto);

    return {
      success: true,
      message: `Unidad ${itemUnit.internal_code} creada exitosamente.`,
    };
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.memoryStorage(),
    }),
  )
  async updateItemUnit(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateItemUnitDto,
  ) {
    if (file) {
      const extension = file.originalname.split('.').pop();
      const key = `arius/item-units/${id}.${extension}`;
      const imageUrl = await this.s3Service.uploadFileWithKey(file, key);
      dto.image_path = `${imageUrl}?t=${Date.now()}`;
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
    return {
      data: stats,
    };
  }

  @Get('get-stats')
  async getStats() {
    const stats = await this.itemUnitsService.getStatusStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id/usage-logs')
  async getUsageLogs(@Param('id', ParseIntPipe) id: number) {
    const logs = await this.itemUnitsService.getUsageLogs(id);
    return logs;
  }

  @Get(':userId/user')
  @UseGuards(JwtAuthGuard)
  async findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    const items = await this.itemUnitsService.findByUser(userId);
    return items;
  }

  @Get(':userId/status-stats-by-user')
  @UseGuards(JwtAuthGuard)
  async getStatusStatsByUser(@Param('userId', ParseIntPipe) userId: number) {
    const stats = await this.itemUnitsService.getStatusStatsByUser(userId);
    console.log('Stats by user:', stats);
    return {
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
  async findAll(@Query() filters?: ItemUnitFilterDto) {
    const itemUnits = await this.itemUnitsService.findAll(filters);

    return {
      success: true,
      data: itemUnits,
    };
  }
}

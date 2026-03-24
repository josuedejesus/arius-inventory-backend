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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/multer.config';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { ItemType } from './enums/item-type.enum';
import { S3Service } from 'src/s3/s3.service';
import { UserRole } from 'src/users/enums/user-role.enum';
import multer from 'multer';
import { MovementType } from 'src/requisitions/enums/movement-type';
import { RequisitionType } from 'src/requisitions/enums/requisition-type';
import { endWith } from 'rxjs';

@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.ADMINISTRATIVE_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: multer.memoryStorage(),
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateItemDto,
  ) {
    let uploadedImages: string[] = [];

    if (files?.length) {
      uploadedImages = await Promise.all(
        files.map((file) => this.s3Service.uploadFile(file, 'item-units')),
      );
    }

    if (dto.item_units?.length) {
      dto.item_units = dto.item_units.map((unit, i) => ({
        ...unit,
        image_path: uploadedImages[i] || undefined,
      }));
    }

    const item = await this.itemsService.create(dto);

    return {
      success: true,
      message: `Articulo creado exitosamente.`,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.ADMINISTRATIVE_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    const item = await this.itemsService.update(dto, id);

    return {
      success: true,
      message: `Articulo ${dto.name} actualizado exitosamente.`,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('type') type?: ItemType) {
    const items = await this.itemsService.findAll(type);

    return {
      data: items,
    };
  }

  @Get('get-all-with-properties')
  @UseGuards(JwtAuthGuard)
  async findAllWithProperties(@Query('locationId') locationId?: number) {
    const items = await this.itemsService.findAllWithProperties({ locationId });
    return {
      data: items,
    };
  }

  @Get('get-catalog')
  @UseGuards(JwtAuthGuard)
  async getCatalog(
    @Query('movement') movement: MovementType,
    @Query('type') type: RequisitionType,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    const catalog = await this.itemsService.getCatalog(movement, type, userId);

    return catalog;
  }

  @Get(':locationId/get-stock')
  @UseGuards(JwtAuthGuard)
  async getStockByLocation(
    @Param('locationId', ParseIntPipe) locationId: number,
  ) {
    const stock = await this.itemsService.getStockByLocation(locationId);
    return stock;
  }

  @Get('get-stats')
  async getStats() {
    const stats = await this.itemsService.getStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Get('get-available-supplies')
  async getAvailableSupplies() {
    const supplies = await this.itemsService.getAvailableSupplies();
    return {
      success: true,
      data: supplies,
    };
  }

  @Get(':id/supply')
  async findSupplyById(@Param('id', ParseIntPipe) id: number) {
    const item = await this.itemsService.findSupplyById(id);
    return {
      success: true,
      data: item,
    };
  }

  @Get('get-supplies-stats')
  async getSuppliesStats() {
    const stats = await this.itemsService.getSuppliesStats();

    return {
      data: stats,
    };
  }

  @Get('get-stock-levels')
  async getItemStockLevels() {
    const levels = await this.itemsService.getItemStockLevels();

    return levels;
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const item = await this.itemsService.findById(id);

    return {
      success: true,
      data: item,
    };
  }
}

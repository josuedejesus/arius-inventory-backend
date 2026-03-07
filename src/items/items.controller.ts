import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemAccessoriesService } from 'src/item-accessories/item-accessories.service';
import { UpdateItemDto } from './dto/update-item.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/multer.config';
import { get } from 'http';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { stat } from 'fs';
import { ItemType } from './enums/item-type.enum';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('type') type?: ItemType) {
    const items = await this.itemsService.findAll(type);

    console.log(items);

    return {
      data: items,
    };
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
  async findAllAvailableSupplies() {
    const supplies = await this.itemsService.findAllAvailableSupplies();

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

    console.log(stats);
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

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateItemDto,
  ) {
    if (files?.length && dto.item_units?.length) {
      dto.item_units = dto.item_units.map((unit, i) => ({
        ...unit,
        image_path: files[i] ? `item-units/${files[i].filename}` : undefined,
      }));
    }

    const item = await this.itemsService.create(dto);

    return {
      success: true,
      message: `Articulo creado exitosamente.`,
    };
  }
}

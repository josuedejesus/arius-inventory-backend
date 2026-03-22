import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  async create(@Body() dto: CreateLocationDto) {
    const location = await this.locationsService.create(dto);

    return {
      success: true,
      message: `Bodega ${location.name} creada exitosamente.`,
    };
  }

  @Put(':locationId')
  async update(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() dto: UpdateLocationDto,
  ) {
    const location = await this.locationsService.update(
      locationId,
      dto,
    );

    return {
      success: true,
      message: `Bodega ${location.name} actualizada exitosamente.`,
    };
  }

  @Get('get-locations-with-inventory')
  async getLocationsWithInventory() {
    const locations = await this.locationsService.getLocationsWithInventory();

    locations;
    return {
      success: true,
      data: locations,
    };
  }

  @Get('get-stats')
  async getStats() {
    const stats = await this.locationsService.getStats();

    return {
      data: stats,
    };
  }

  @Get(':userId/user')
  async findByUserId(@Param('userId') userId: string) {
    const locations = await this.locationsService.findByUser(Number(userId));
    return locations;
  }


  @Get(':locationId')
  async findById(@Param('locationId') locationId: string) {
    const location = await this.locationsService.findById(locationId);
    return {
      success: true,
      data: location,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAllLocations(@Req() req: any) {
    const locations = await this.locationsService.findAll();

    return {
      success: true,
      data: locations,
    };
  }
}

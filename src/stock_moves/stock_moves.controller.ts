import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StockMovesService } from './stock_moves.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('stock-moves')
export class StockMovesController {
  constructor(private readonly stockMovesService: StockMovesService) {}

  @Get(':locationId/location')
  async findByLocation(@Param('locationId') locationId: string) {
    const movements = await this.stockMovesService.findByLocation(locationId);

    return {
      success: true,
      data: movements,
    };
  }

  @Get('get-by-item-unit/:unitId')
  @UseGuards(JwtAuthGuard)
  async findByItemUnitId(@Param('unitId') unitId: string) {
    const movements = await this.stockMovesService.findByUnitId(unitId);

    return {
      success: true,
      data: movements,
    };
  }
}

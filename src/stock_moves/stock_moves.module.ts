import { Module } from '@nestjs/common';
import { StockMovesController } from './stock_moves.controller';
import { StockMovesService } from './stock_moves.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [StockMovesController],
  providers: [StockMovesService],
  imports: [DatabaseModule],
  exports: [StockMovesService]
})
export class StockMovesModule {}

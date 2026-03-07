import { Test, TestingModule } from '@nestjs/testing';
import { StockMovesController } from './stock_moves.controller';

describe('StockMovesController', () => {
  let controller: StockMovesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockMovesController],
    }).compile();

    controller = module.get<StockMovesController>(StockMovesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

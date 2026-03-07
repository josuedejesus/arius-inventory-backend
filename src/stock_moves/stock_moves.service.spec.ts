import { Test, TestingModule } from '@nestjs/testing';
import { StockMovesService } from './stock_moves.service';

describe('StockMovesService', () => {
  let service: StockMovesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockMovesService],
    }).compile();

    service = module.get<StockMovesService>(StockMovesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

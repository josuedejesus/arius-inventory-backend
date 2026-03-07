import { Test, TestingModule } from '@nestjs/testing';
import { ItemUnitsService } from './item-units.service';

describe('ItemUnitsService', () => {
  let service: ItemUnitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemUnitsService],
    }).compile();

    service = module.get<ItemUnitsService>(ItemUnitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

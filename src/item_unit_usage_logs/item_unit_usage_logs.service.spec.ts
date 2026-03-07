import { Test, TestingModule } from '@nestjs/testing';
import { ItemUnitUsageLogsService } from './item_unit_usage_logs.service';

describe('ItemUnitUsageLogsService', () => {
  let service: ItemUnitUsageLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemUnitUsageLogsService],
    }).compile();

    service = module.get<ItemUnitUsageLogsService>(ItemUnitUsageLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

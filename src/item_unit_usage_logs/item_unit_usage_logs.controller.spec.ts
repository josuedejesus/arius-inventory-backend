import { Test, TestingModule } from '@nestjs/testing';
import { ItemUnitUsageLogsController } from './item_unit_usage_logs.controller';

describe('ItemUnitUsageLogsController', () => {
  let controller: ItemUnitUsageLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemUnitUsageLogsController],
    }).compile();

    controller = module.get<ItemUnitUsageLogsController>(ItemUnitUsageLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

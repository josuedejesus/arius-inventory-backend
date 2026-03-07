import { Test, TestingModule } from '@nestjs/testing';
import { ItemAccessoriesController } from './item-accessories.controller';

describe('ItemAccessoriesController', () => {
  let controller: ItemAccessoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemAccessoriesController],
    }).compile();

    controller = module.get<ItemAccessoriesController>(ItemAccessoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

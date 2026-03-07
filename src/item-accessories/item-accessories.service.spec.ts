import { Test, TestingModule } from '@nestjs/testing';
import { ItemAccessoriesService } from './item-accessories.service';

describe('ItemAccessoriesService', () => {
  let service: ItemAccessoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemAccessoriesService],
    }).compile();

    service = module.get<ItemAccessoriesService>(ItemAccessoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

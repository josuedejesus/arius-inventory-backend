import { Test, TestingModule } from '@nestjs/testing';
import { RequisitionLineAccessoriesService } from './requisition-line-accessories.service';

describe('RequisitionLineAccessoriesService', () => {
  let service: RequisitionLineAccessoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequisitionLineAccessoriesService],
    }).compile();

    service = module.get<RequisitionLineAccessoriesService>(RequisitionLineAccessoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

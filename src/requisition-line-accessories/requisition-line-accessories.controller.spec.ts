import { Test, TestingModule } from '@nestjs/testing';
import { RequisitionLineAccessoriesController } from './requisition-line-accessories.controller';

describe('RequisitionLineAccessoriesController', () => {
  let controller: RequisitionLineAccessoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequisitionLineAccessoriesController],
    }).compile();

    controller = module.get<RequisitionLineAccessoriesController>(RequisitionLineAccessoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

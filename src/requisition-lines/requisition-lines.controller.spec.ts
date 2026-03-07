import { Test, TestingModule } from '@nestjs/testing';
import { RequisitionLinesController } from './requisition-lines.controller';

describe('RequisitionLinesController', () => {
  let controller: RequisitionLinesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequisitionLinesController],
    }).compile();

    controller = module.get<RequisitionLinesController>(RequisitionLinesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

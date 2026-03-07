import { Test, TestingModule } from '@nestjs/testing';
import { RequisitionLinePhotosController } from './requisition_line_photos.controller';

describe('RequisitionLinePhotosController', () => {
  let controller: RequisitionLinePhotosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequisitionLinePhotosController],
    }).compile();

    controller = module.get<RequisitionLinePhotosController>(RequisitionLinePhotosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

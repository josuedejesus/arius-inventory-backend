import { Test, TestingModule } from '@nestjs/testing';
import { RequisitionLinePhotosService } from './requisition_line_photos.service';

describe('RequisitionLinePhotosService', () => {
  let service: RequisitionLinePhotosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequisitionLinePhotosService],
    }).compile();

    service = module.get<RequisitionLinePhotosService>(RequisitionLinePhotosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

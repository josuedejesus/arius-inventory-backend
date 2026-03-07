import { Test, TestingModule } from '@nestjs/testing';
import { RequisitionLinesService } from './requisition-lines.service';

describe('RequisitionLinesService', () => {
  let service: RequisitionLinesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequisitionLinesService],
    }).compile();

    service = module.get<RequisitionLinesService>(RequisitionLinesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

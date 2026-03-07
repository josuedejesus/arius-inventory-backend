import { Test, TestingModule } from '@nestjs/testing';
import { LocationMembersService } from './location_members.service';

describe('LocationMembersService', () => {
  let service: LocationMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationMembersService],
    }).compile();

    service = module.get<LocationMembersService>(LocationMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

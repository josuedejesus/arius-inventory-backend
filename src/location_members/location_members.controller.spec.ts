import { Test, TestingModule } from '@nestjs/testing';
import { LocationMembersController } from './location_members.controller';

describe('LocationMembersController', () => {
  let controller: LocationMembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationMembersController],
    }).compile();

    controller = module.get<LocationMembersController>(LocationMembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

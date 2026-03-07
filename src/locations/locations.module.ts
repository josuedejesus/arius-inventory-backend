import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { DatabaseModule } from 'src/database/database.module';
import { LocationMembersModule } from 'src/location_members/location_members.module';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService],
  imports: [DatabaseModule, LocationMembersModule],
  exports: [LocationsService]
})
export class LocationsModule {}

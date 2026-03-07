import { Module } from '@nestjs/common';
import { LocationMembersService } from './location_members.service';
import { LocationMembersController } from './location_members.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  providers: [LocationMembersService],
  controllers: [LocationMembersController],
  imports: [DatabaseModule],
  exports: [LocationMembersService],
})
export class LocationMembersModule {}

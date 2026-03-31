import { Module } from '@nestjs/common';
import { PersonsController } from './persons.controller';
import { PersonsService } from './persons.service';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { User } from 'src/users/entities/user.entity';
import { LocationsModule } from 'src/locations/locations.module';
import { LocationMembersModule } from 'src/location_members/location_members.module';

@Module({
  controllers: [PersonsController],
  providers: [PersonsService],
  imports: [DatabaseModule, TypeOrmModule.forFeature([Person, User]), LocationsModule, LocationMembersModule],
  exports: [PersonsService],
})
export class PersonsModule {}

import { Module } from '@nestjs/common';
import { PersonsController } from './persons.controller';
import { PersonsService } from './persons.service';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  controllers: [PersonsController],
  providers: [PersonsService],
  imports: [DatabaseModule, TypeOrmModule.forFeature([Person, User])],
  exports: [PersonsService],
})
export class PersonsModule {}

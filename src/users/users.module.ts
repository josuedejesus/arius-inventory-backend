import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from 'src/persons/entities/person.entity';
import { User } from './entities/user.entity';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [DatabaseModule, TypeOrmModule.forFeature([User, Person])],
  exports: [UsersService],
})
export class UsersModule {}

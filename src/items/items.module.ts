import { forwardRef, Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { DatabaseModule } from 'src/database/database.module';
import { ItemAccessoriesModule } from 'src/item-accessories/item-accessories.module';
import { ItemUnitsModule } from 'src/item-units/item-units.module';
import { S3Module } from 'src/s3/s3.module';
import { UsersModule } from 'src/users/users.module';
import { PersonsModule } from 'src/persons/persons.module';
import { LocationsModule } from 'src/locations/locations.module';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService],
  imports: [
    DatabaseModule,
    ItemAccessoriesModule,
    forwardRef(() => ItemUnitsModule),
    S3Module,
    forwardRef(() => UsersModule),
    forwardRef(() => PersonsModule),
    LocationsModule
  ],
  exports: [ItemsService],
})
export class ItemsModule {}

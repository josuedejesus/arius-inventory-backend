import { forwardRef, Module } from '@nestjs/common';
import { ItemUnitsController } from './item-units.controller';
import { ItemUnitsService } from './item-units.service';
import { DatabaseModule } from 'src/database/database.module';
import { ItemsModule } from 'src/items/items.module';
import { LocationsModule } from 'src/locations/locations.module';
import { UsersModule } from 'src/users/users.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  controllers: [ItemUnitsController],
  providers: [ItemUnitsService],
  imports: [
    DatabaseModule,
    UsersModule,
    forwardRef(() => ItemsModule),
    LocationsModule,
    S3Module,
  ],
  exports: [ItemUnitsService],
})
export class ItemUnitsModule {}

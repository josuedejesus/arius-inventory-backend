import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ItemUnitsModule } from 'src/item-units/item-units.module';
import { ItemsModule } from 'src/items/items.module';
import { LocationsModule } from 'src/locations/locations.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [DashboardService],
  controllers: [DashboardController],
  imports: [
    ItemUnitsModule,
    ItemsModule,
    LocationsModule,
    UsersModule
  ],
  exports: [DashboardService],
})
export class DashboardModule {}

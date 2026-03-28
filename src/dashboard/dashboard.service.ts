import { Inject, Injectable } from '@nestjs/common';
import { ItemUnitsService } from 'src/item-units/item-units.service';
import { ItemsService } from 'src/items/items.service';
import { LocationsService } from 'src/locations/locations.service';
import { LocationType } from 'src/locations/types/location-type';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly itemUnitsService: ItemUnitsService,
    private readonly itemService: ItemsService,
    private readonly locationsService: LocationsService,
    private readonly usersService: UsersService,
  ) {}

  async getDashboardDataForInternalUser() {
    const totalItemUnits = await this.itemUnitsService.getCount();
    const totalSupplies = await this.itemService.getSuppliesCount({
      supplies: {
        locationType: LocationType.WAREHOUSE,
      },
    });
    const totalActiveLocations =
      await this.locationsService.countActiveLocations();
    const totalActiveUsers = await this.usersService.countActiveUsers();

    return {
      totalItemUnits,
      totalSupplies,
      totalActiveLocations,
      totalActiveUsers,
    };
  }

  async getDashboardDataForExternalUser(userId: number) {
    const totalItemUnits = await this.itemUnitsService.findByUser(userId).then(units => units.length);
    const totalActiveLocations =
      await this.locationsService.findByUser(userId).then(locations => locations.length);

    return {
      totalItemUnits,
      totalActiveLocations,
    };
  }
}

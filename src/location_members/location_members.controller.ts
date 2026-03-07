import { Controller, Get, Inject, Param } from '@nestjs/common';
import { LocationMembersService } from './location_members.service';

@Controller('location-members')
export class LocationMembersController {
    constructor(
        private readonly locatioMembersService: LocationMembersService
    ) {}

    @Get(':locationId')
    async getMByLocation(@Param('locationId') locationId: string) {
        const members = await this.locatioMembersService.getByLocationId(Number(locationId));

        return {
            success: true,
            data: members,
        }
    }
}

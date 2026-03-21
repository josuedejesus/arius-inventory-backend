import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { LocationMembersService } from './location_members.service';
import { use } from 'passport';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

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

    @Get(':personId/person')
    @UseGuards(JwtAuthGuard)
    async getByPerson(@Param('personId') personId: string) {
        const members = await this.locatioMembersService.getByPersonId(Number(personId));
        return members;
    }
}

import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccessoriesService } from './accessories.service';
import { CreateAccessoryDto } from './dto/create-accessory.dto';

@Controller('accessories')
export class AccessoriesController {
    constructor(
        private readonly accessoriesService: AccessoriesService
    ) {}

    @Get()
    async getAccessories() {
        const accessories = await this.accessoriesService.getAccesories();

        return {
            success: true,
            data: accessories
        };
    }

    @Post()
    async createAccessory(@Body() dto: CreateAccessoryDto) {
        const accessory = await this.accessoriesService.createAccesoryDto(dto);

        return {
            success: true,
            message: `Accesorio ${accessory.name} creado exitosamente.`
        };
    }
}

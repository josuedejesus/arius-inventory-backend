import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { identity } from 'rxjs';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Controller('units')
export class UnitsController {
    constructor(
        private readonly unitsService: UnitsService
    ) {}

    @Post()
    async create(@Body() dto: CreateUnitDto) {
        const unit = await this.unitsService.createUnit(dto);

        return {
            success: true,
            message: `Unidad ${unit.name} creada exitosamente.`
        };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUnitDto ) {
        const unit = await this.unitsService.update(id, dto);

        return {
            success: true,
            message: `Unidad ${unit.name} actualizada exitosamente.`
        };
    }

    @Get()
    async findAll() {
        const units = await this.unitsService.getUnits();
        
        return {
            sucess: true,
            data: units,
        };
    }

    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number) {
        const unit = await this.unitsService.findById(id);
        return {
            success: true,
            data: unit,
        };
    }
}

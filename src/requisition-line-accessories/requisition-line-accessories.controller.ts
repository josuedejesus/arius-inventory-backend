import { Controller, Get, Param } from '@nestjs/common';
import { RequisitionLineAccessoriesService } from './requisition-line-accessories.service';

@Controller('requisition-line-accessories')
export class RequisitionLineAccessoriesController {
    constructor (
        private readonly requisitionLineAccessoriesService: RequisitionLineAccessoriesService
    ) {}

    @Get('/find-by-item-unit/:itemUnitId')
    async findByItemUnitId(@Param("itemUnitId") itemUnitId: string) {

        const accessories = await this.requisitionLineAccessoriesService.findByItemUnit(itemUnitId);


        return {
            success: true,
            data: []
        };
    }
}

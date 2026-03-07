import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { RequisitionType } from "src/requisitions/enums/requisition-type";

export class GetByTypeDto {
    @IsString()
    @IsOptional()
    destinationId?: string

    @IsEnum(RequisitionType)
    @IsNotEmpty()
    requisitionType: RequisitionType
}
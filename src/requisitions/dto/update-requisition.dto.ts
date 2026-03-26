import { IsArray, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { RequisitionType } from "../enums/requisition-type";
import { MovementType } from "../enums/movement-type";

export class UpdateRequisitionDto {
    @IsNumber()
    @IsNotEmpty()
    requested_by: number

    @IsNumber()
    @IsOptional()
    destination_location_id: number

    @IsEnum(MovementType)
    @IsNotEmpty()
    movement: MovementType

    @IsEnum(RequisitionType)
    @IsNotEmpty()
    type: RequisitionType

    @IsString()
    @IsNotEmpty()
    status: string

    @IsString()
    @IsOptional()
    notes: string

    @IsString()
    @IsNotEmpty()
    schedulled_at: string

    @IsArray()
    @IsNotEmpty()
    lines: {
        id?: string,
        item_id: string,
        item_unit_id: string,
        quantity: string,
        accessories: any[],
    }[]
}
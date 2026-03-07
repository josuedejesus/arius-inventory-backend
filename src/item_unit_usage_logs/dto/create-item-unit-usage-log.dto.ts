import { IsDate, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class createItemUnitUsageLogDto {
    @IsString()
    @IsNotEmpty()
    item_unit_id: string

    @IsString()
    @IsNotEmpty()
    requisition_id: string

    @IsDateString()
    @IsOptional()
    start_date?: string

    @IsDateString()
    @IsOptional()
    end_date?: string

    @IsNumber()
    @IsOptional()
    hours_used?: number
}
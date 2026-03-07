import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CreateItemUnitDto {
    @IsNotEmpty()
    @IsString()
    item_id: string

    @IsOptional()
    @IsString()
    serial_number: string

    @IsNotEmpty()
    @IsString()
    internal_code: string

    @IsNotEmpty()
    @IsString()
    status: string

    @IsNotEmpty()
    @IsString()
    condition: string

    @IsOptional()
    @IsString()
    description: string

    @IsOptional()
    @IsString()
    observations: string

    @IsString()
    @IsNotEmpty()
    is_active: boolean

    @IsOptional()
    @IsString()
    image_path?: string
}
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUnitDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsNotEmpty()
    code: string

    @IsString()
    @IsOptional()
    description: string

    @IsBoolean()
    @IsNotEmpty()
    is_active: boolean
}
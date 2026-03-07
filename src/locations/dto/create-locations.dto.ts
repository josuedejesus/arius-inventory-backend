import { IsArray, IsBoolean, isNotEmpty, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateLocationDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsNotEmpty()
    type: string

    @IsString()
    @IsOptional()
    location: string

    @IsBoolean()
    @IsNotEmpty()
    is_active: boolean

    @IsArray()
    @IsOptional()
    location_members?: any[]
}
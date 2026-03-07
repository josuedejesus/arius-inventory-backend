import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAccessoryDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsOptional()
    description: string

    @IsBoolean()
    @IsNotEmpty()
    is_active: boolean
}
import { IsArray, IsBoolean, isNotEmpty, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateLocationDto {
    @IsString()
    @IsNotEmpty( { message: 'El nombre es obligatorio' })
    name: string

    @IsString()
    @IsNotEmpty( { message: 'El tipo es obligatorio' })
    type: string

    @IsString()
    @IsOptional()
    location: string

    @IsBoolean()
    @IsNotEmpty({ message: 'El estado es obligatorio' })
    is_active: boolean

    @IsArray()
    @IsOptional()
    location_members: any[]
}
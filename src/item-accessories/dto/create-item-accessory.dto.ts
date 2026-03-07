import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class CreateItemAccessoryDto {
    @IsString()
    @IsNotEmpty()
    item_id: string

    @IsString()
    @IsNotEmpty()
    accessory_id: string

    @IsBoolean()
    @IsNotEmpty()
    required: boolean

    @IsBoolean()
    @IsNotEmpty()
    is_active: boolean
}
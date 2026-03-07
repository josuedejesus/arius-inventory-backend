import { IsBoolean, IsInt, IsNotEmpty, IsString } from "class-validator";

export class ItemAccessoryDto {
    @IsInt()
    @IsNotEmpty()
    id: number

    @IsString()
    @IsNotEmpty()
    name: string
}
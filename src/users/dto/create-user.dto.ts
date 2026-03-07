import { IsBoolean, IsEmpty, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { UserRole } from "../enums/user-role.enum";

export class CreateUserDTO {
    @IsString()
    @IsNotEmpty()
    username: string

    @IsString()
    @IsNotEmpty()
    password: string

    @IsBoolean()
    @IsNotEmpty()
    is_active: boolean

    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole
}
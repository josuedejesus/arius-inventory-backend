import { IsBoolean, IsEmpty, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { UserRole } from "../enums/user-role.enum";

export class CreateUserDTO {
    @IsString()
    @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
    username: string

    @IsString()
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    password: string

    @IsBoolean()
    @IsNotEmpty({ message: 'El estado activo es obligatorio' })
    is_active: boolean

    @IsEnum(UserRole)
    @IsNotEmpty({ message: 'El rol es obligatorio' })
    role: UserRole
}
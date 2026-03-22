import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}

import {
  IsBoolean,
  IsDate,
  IsEnum,
  isEnum,
  IsNumber,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class UserViewModel {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsBoolean()
  is_active: boolean;

  @IsNumber()
  person_id: number;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;
}

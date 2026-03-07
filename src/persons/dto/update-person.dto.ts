import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { PersonRole } from '../enums/person-role.enum';
import { Type } from 'class-transformer';

export class UpdatePersonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsPhoneNumber('HN')
  phone: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email: string;

  @IsEnum(PersonRole)
  @IsNotEmpty()
  role: PersonRole;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @IsOptional()
  rtn: string;
}

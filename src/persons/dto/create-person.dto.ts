import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { PersonRole } from '../enums/person-role.enum';
import { Type } from 'class-transformer';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PersonRole)
  @IsNotEmpty()
  role: PersonRole;

  @IsString()
  @Length(8, 20)
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @IsOptional()
  rtn: string;

  //user
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserDTO)
  user?: CreateUserDTO;
}

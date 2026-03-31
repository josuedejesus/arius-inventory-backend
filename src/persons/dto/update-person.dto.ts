import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PersonRole } from '../enums/person-role.enum';
import { Type } from 'class-transformer';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

export class UpdatePersonDto {
  @IsString()
  @IsNotEmpty( { message: 'El nombre es obligatorio' })
  name: string;

  @IsString( { message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty( { message: 'El teléfono es obligatorio' })
  @IsPhoneNumber('HN', { message: 'El teléfono no es válido' })
  phone: string;

  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsEnum(PersonRole)
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  role: PersonRole;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @IsOptional()
  rtn: string;

  //user
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateUserDto)
    user?: UpdateUserDto;

  //locations
    @IsOptional()
    @IsArray()
    locations?: any[]
}

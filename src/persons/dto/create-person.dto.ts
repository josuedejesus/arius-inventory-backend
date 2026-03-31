import {
  IsArray,
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
import { Transform, Type } from 'class-transformer';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsEnum(PersonRole)
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  role: PersonRole;

  @IsString()
  @Length(8, 20, { message: 'El teléfono debe tener entre 8 y 20 caracteres' })
  phone: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
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

  //locations
  @IsOptional()
  @IsArray()
  locations?: any[]
}

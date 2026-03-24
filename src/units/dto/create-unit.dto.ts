import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El código es obligatorio' })
  code: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsBoolean()
  @IsNotEmpty({ message: 'El estado activo es obligatorio' })
  is_active: boolean;
}

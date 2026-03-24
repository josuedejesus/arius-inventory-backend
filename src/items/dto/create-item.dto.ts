import {
  isArray,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ItemType } from '../enums/item-type.enum';
import { Transform, Type } from 'class-transformer';
import { IsRequiredForType } from '../validators/item.validator';

export class CreateItemDto {
  //Item
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  brand: string;

  @IsString()
  @IsOptional()
  model: string;

  @IsString()
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  type: string;

  @IsString()
  @IsNotEmpty({ message: 'El seguimiento es obligatorio' })
  tracking: string;

  @IsString()
  @IsNotEmpty({ message: 'La unidad es obligatoria' })
  unit_id: string;

  @IsString()
  @IsNotEmpty({ message: 'El estado activo es obligatorio' })
  is_active: string;

  @IsRequiredForType(ItemType.SUPPLY, {
    message: 'El campo stock mínimo es obligatorio para el tipo insumo',
  })
  @IsOptional()
  minimum_stock?: number;

  @IsRequiredForType(ItemType.TOOL, {
    message: 'El campo horas de uso es obligatorio para el tipo equipo',
  })
  @IsOptional()
  usage_hours?: number;

  //Accessories
  @Transform(({ value }) => {
    if (typeof value === 'string') return JSON.parse(value);
    return value;
  })
  @IsArray()
  item_units: any[];

  @Transform(({ value }) => {
    if (typeof value === 'string') return JSON.parse(value);
    return value;
  })
  @IsArray()
  accessories: any[];
}

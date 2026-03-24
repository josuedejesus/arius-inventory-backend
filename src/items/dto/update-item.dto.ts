import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ItemType } from '../enums/item-type.enum';
import { IsRequiredForType } from '../validators/item.validator';

export class UpdateItemDto {
  //Item
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString()
  @IsOptional()
  brand: string;

  @IsString()
  @IsOptional()
  model: string;

  @IsEnum(ItemType)
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  type: ItemType;

  @IsString()
  @IsNotEmpty({ message: 'El seguimiento es obligatorio' })
  tracking: string;

  @IsNumber()
  @IsNotEmpty({ message: 'La unidad es obligatoria' })
  unit_id: number;

  @IsBoolean()
  @IsNotEmpty({ message: 'El estado activo es obligatorio' })
  is_active: boolean;

  @IsOptional()
  @IsRequiredForType(ItemType.SUPPLY, {
    message: 'El campo stock mínimo es obligatorio para el tipo insumo',
  })
  minimum_stock?: number;

  @IsOptional()
  @IsRequiredForType(ItemType.TOOL, {
    message: 'El campo horas de uso es obligatorio para el tipo equipo',
  })
  usage_hours?: number;

  //Accessories
  @IsArray()
  @IsOptional()
  accessories?: any;

  @IsArray()
  @IsOptional()
  item_units?: any[];
}

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
import { ItemAccessoryDto } from './item-accessory.dto';
import { ItemType } from '../enums/item-type.enum';
import { CreateItemUnitDto } from 'src/item-units/dto/create-item-unit.dto';
import { Transform, Type } from 'class-transformer';
import { CreateItemAccessoryDto } from 'src/item-accessories/dto/create-item-accessory.dto';

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
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  tracking: string;

  @IsString()
  @IsNotEmpty()
  unit_id: string;

  @IsString()
  @IsNotEmpty()
  is_active: string;

  @IsString()
  @IsOptional()
  minimum_stock?: string;

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

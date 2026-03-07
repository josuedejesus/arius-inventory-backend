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

export class UpdateItemDto {
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

  @IsEnum(ItemType)
  @IsNotEmpty()
  type: ItemType;

  @IsString()
  @IsNotEmpty()
  tracking: string;

  @IsNumber()
  @IsNotEmpty()
  unit_id: number;

  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;

  @IsNumber()
  @IsOptional()
  minimum_stock?: number;

  @IsNumber()
  @IsOptional()
  usage_hours?: number;

  //Accessories
  @IsArray()
  @IsOptional()
  accessories?: any;

  @IsArray()
  @IsOptional()
  item_units?: any[];
}

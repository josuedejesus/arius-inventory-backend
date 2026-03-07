import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ItemType } from '../enums/item-type.enum';

export class ItemViewModel {
  @IsNumber()
  id: number;

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
  type: ItemType;

  @IsString()
  @IsNotEmpty()
  tracking: string;

  @IsNumber()
  unit_id: number;

  @IsBoolean()
  is_active: boolean;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;

  @IsString()
  image_path: string;

  @IsNumber()
  minimum_stock?: number;

  @IsNumber()
  usage_hours: number;

  //extras
  @IsString()
  unit_name: string;

  @IsString()
  unit_code: string;
}

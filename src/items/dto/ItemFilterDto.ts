import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  isString,
} from 'class-validator';
import { ItemType } from '../enums/item-type.enum';

export class ItemFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  //extra filters for locations
  @IsOptional()
  @IsString()
  location_id?: string;
}

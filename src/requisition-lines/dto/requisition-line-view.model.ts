import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsString,
} from 'class-validator';
import { ItemUnitStatus } from 'src/item-units/enums/item-unit-status.enum';

export class RequisitionLineViewModel {
  @IsNumber()
  id: number;

  @IsNumber()
  requisition_id: number;

  @IsNumber()
  item_id: number;

  @IsNumber()
  item_unit_id: number;

  @IsNumber()
  quantity: number;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;

  @IsNumber()
  return_of_line_id: number;

  @IsNumber()
  source_location_id: number;

  @IsNumber()
  destination_location_id: number;

  @IsBoolean()
  is_deleted: boolean;

  @IsDate()
  deleted_at: Date;

  //extras
  @IsString()
  name: string;

  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsNumber()
  internal_code: number;

  @IsNumber()
  location_id: number;

  @IsEnum(ItemUnitStatus)
  status: ItemUnitStatus;

  @IsString()
  unit_code: string;

  @IsString()
  unit_name: string;

  @IsString()
  source_location_name: string;

  @IsString()
  destination_location_name: string;

  @IsNumber()
  photos_count: number;

  @IsBoolean()
  has_return: boolean;

  @IsArray()
  accessories: any[];
}

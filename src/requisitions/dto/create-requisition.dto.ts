import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { RequisitionType } from '../enums/requisition-type';
import { MovementType } from '../enums/movement-type';

export class CreateRequisitionDto {
  @IsString()
  @IsNotEmpty()
  requested_by: string;

  @IsNumber()
  @IsOptional()
  destination_location_id: number;

  @IsEnum(MovementType)
  @IsNotEmpty()
  movement: MovementType;

  @IsEnum(RequisitionType)
  @IsNotEmpty()
  type: RequisitionType;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  notes: string;

  @IsString()
  @IsNotEmpty()
  schedulled_at: string;

  @IsArray()
  @IsNotEmpty()
  lines: {
    item_id: number;
    item_unit_id: string;
    quantity: number;
    accessories: any[];
  }[];
}

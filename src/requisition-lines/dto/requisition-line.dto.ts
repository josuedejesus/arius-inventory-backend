import { IsBoolean, IsDate, IsNumber } from 'class-validator';

export class RequisitionLineDto {
  @IsNumber()
  id: number;

  @IsNumber()
  requisition_id: number;

  @IsNumber()
  item_id: number;

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
}

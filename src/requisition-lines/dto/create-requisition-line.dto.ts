import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateRequisitionLineDto {
  @IsNotEmpty()
  @IsNumber()
  item_id: number;

  @IsNotEmpty()
  @IsNumber()
  item_unit_id: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

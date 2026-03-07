import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateItemUnitDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  item_id: number;

  @IsString()
  @IsOptional()
  serial_number: string;

  @IsString()
  @IsOptional()
  internal_code: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  condition: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  observations: string;

  @IsString()
  @IsNotEmpty()
  is_active: boolean;

  @IsString()
  @IsOptional()
  image_path?: string
}

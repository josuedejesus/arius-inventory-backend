import { IsOptional, IsNumber, IsString, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { LocationType } from '@aws-sdk/client-s3';
import { ItemType } from '../enums/item-type.enum';

export class ItemFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

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

  @IsOptional()
  @IsNumber()
  uniId?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  //extras
  @IsOptional()
  @IsString()
  locationType?: LocationType;

  @IsOptional()
  @Transform(({ value }) => 
    Array.isArray(value) ? value.map(Number) : [Number(value)]
  )
  @IsArray()
  @IsNumber({}, { each: true })
  locationIds?: number[];

  @IsOptional()
  @Type(() => Boolean)
  unlimited?: boolean; 
}
import {
  IsBoolean,
  IsDataURI,
  IsDate,
  IsEnum,
  IsNumber,
  IsString,
} from 'class-validator';
import { LocationType } from '../types/location-type';

export class LocationViewModel {
  @IsNumber()
  id: string;

  @IsString()
  name: string;

  @IsEnum(LocationType)
  type: LocationType;

  @IsString()
  location: string;

  @IsBoolean()
  is_active: boolean;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;

  constructor(data: Partial<LocationViewModel>) {
    Object.assign(this, data);
  }
}

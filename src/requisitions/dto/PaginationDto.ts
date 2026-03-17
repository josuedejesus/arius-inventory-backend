import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class PagedRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skipCount?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxResultCount?: number = 10;

  @IsOptional()
  @IsString()
  sorting?: string;
}

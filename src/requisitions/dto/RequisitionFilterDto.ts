import { IsBoolean, isEnum, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RequisitionType } from '../enums/requisition-type';
import { RequisitionStatus } from '../enums/requisition-status.enum';

export class RequisitionFilterDto {
  @IsOptional()
  @IsEnum(RequisitionType)
  type?: RequisitionType;

  @IsOptional()
  @IsEnum(RequisitionStatus)
  status?: RequisitionStatus;

  @IsOptional()
  @IsBoolean()
  returned?: boolean;
}

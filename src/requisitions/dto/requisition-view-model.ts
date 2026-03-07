import { IsArray, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { RequisitionType } from "../enums/requisition-type";
import { RequisitionStatus } from "../enums/requisition-status.enum";

export class RequisitionViewModel {
    @IsNumber()
    id: number

    @IsNumber()
    requested_by: number

    @IsNumber()
    destination_location_id: number

    @IsEnum(RequisitionStatus)
    status: RequisitionStatus

    @IsString()
    notes: string

    @IsDate()
    created_at: Date

    @IsDate()
    updated_at: Date

    @IsEnum(RequisitionType)
    type: RequisitionType

    @IsNumber()
    approved_by: number

    @IsDate()
    approved_at: Date

    @IsDate()
    excecuted_at: Date

    @IsDate()
    received_at: Date

    @IsDate()
    schedulled_at: Date

    @IsNumber()
    return_of_id: number


    // EXTRA FIELDS
    @IsString()
    requestor_name: string

    @IsString()
    destination_location_name: string

}
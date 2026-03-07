import { IsNotEmpty, IsString } from "class-validator";

export class CreateRequisitionLinePhotosDto {
    @IsString()
    @IsNotEmpty()
    requisition_line_id: string
}
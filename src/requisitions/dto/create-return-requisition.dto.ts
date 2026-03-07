import { IsNotEmpty, IsString } from "class-validator";

export class CreateReturnRequisitionDto {
    @IsString()
    @IsNotEmpty()
    id: string
}
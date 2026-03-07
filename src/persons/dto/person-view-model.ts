import { IsDate, IsEnum, isEnum, IsNumber, IsPhoneNumber, IsString } from "class-validator"
import { PersonRole } from "../enums/person-role.enum";

export class PersonViewModel {
    @IsNumber()
    id: number;

    @IsString()
    name: string;

    @IsString()
    phone: string;

    @IsString()
    email: string;

    @IsEnum(PersonRole)
    role: PersonRole;

    @IsDate()
    created_at: Date;

    @IsDate()
    updated_at: Date;

    @IsString()
    address: string;

    @IsString()
    rtn: string;
}
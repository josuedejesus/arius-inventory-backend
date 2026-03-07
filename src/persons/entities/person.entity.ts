import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { PersonRole } from "../enums/person-role.enum";
import { User } from "src/users/entities/user.entity";

@Entity('persons')
export class Person {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 200})
    name: string;

    @Column({ unique: true, length: 20 })
    phone: string;

    @Column({ unique: true })
    email: string;

    @Column({
        type: 'enum',
        enum: PersonRole,
        default: PersonRole.EMPLOYEE
    })
    role: PersonRole;

    @Column({type: 'timestamp' })
    created_at: Date;

    @Column({type: 'timestamp'})
    updated_at: Date;

    @Column({ nullable: true })
    address: string;

    @Column({ unique: true, nullable: true })
    rtn: string;

    @OneToOne(() => User, user => user.person)
    user: User;
}
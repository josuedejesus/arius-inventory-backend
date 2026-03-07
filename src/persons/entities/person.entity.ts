import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { PersonRole } from "../enums/person-role.enum";
import { User } from "src/users/entities/user.entity";

@Entity('persons')
export class Person {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: PersonRole,
    default: PersonRole.EMPLOYEE
  })
  role: PersonRole;

  @Column({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'varchar', nullable: true })
  address: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  rtn: string;

  @OneToOne(() => User, user => user.person)
  user: User;
}
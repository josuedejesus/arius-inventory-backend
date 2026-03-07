import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { Person } from 'src/persons/entities/person.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'varchar' })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ type: 'boolean' })
  is_active: boolean;

  @Column({ type: 'int', nullable: true })
  person_id?: number | null;

  @OneToOne(() => Person, (p) => p.user, { nullable: true })
  @JoinColumn({
    name: 'person_id',
  })
  person: Person | null;

  @Column({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp' })
  updated_at: Date;
}
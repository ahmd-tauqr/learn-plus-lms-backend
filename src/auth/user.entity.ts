import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Enrollment } from '../courses/course.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.user)
  enrollments: Enrollment[];
}

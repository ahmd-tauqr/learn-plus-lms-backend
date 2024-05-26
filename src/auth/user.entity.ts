import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Enrollment } from 'src/courses/course.entity';

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

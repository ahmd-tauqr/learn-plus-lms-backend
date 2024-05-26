import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { CourseStatus, LessonStatus } from './course.enum';
import { User } from 'src/auth/user.entity';

@Entity()
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.OPEN,
  })
  status: CourseStatus;

  @OneToMany(() => Lesson, (lesson) => lesson.course, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  lessons: Lesson[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  enrollments: Enrollment[];

  @Column('simple-array')
  tags: string[];

  @Column({ type: 'int', default: 0 })
  enrollmentsCount: number;
}

@Entity()
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: LessonStatus,
    default: LessonStatus.NOT_STARTED,
  })
  status: LessonStatus;

  @ManyToOne(() => Course, (course) => course.lessons)
  course: Course;
}

@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.enrollments, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Course, (course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  course: Course;

  @Column({ type: 'float', default: 0 })
  progress: number;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { EnrollmentStatus, LessonStatus } from './course.enum';

@Entity()
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

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

  @ManyToOne(() => Course, (course) => course.lessons, {
    onDelete: 'CASCADE',
  })
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

  @OneToMany(
    () => LessonProgress,
    (lessonProgress) => lessonProgress.enrollment,
    {
      cascade: true,
    },
  )
  lessonProgress: LessonProgress[];

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.NOT_STARTED,
  })
  status: EnrollmentStatus;
}

@Entity()
export class LessonProgress {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: LessonStatus,
    default: LessonStatus.NOT_STARTED,
  })
  status: LessonStatus;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.lessonProgress, {
    onDelete: 'CASCADE',
  })
  enrollment: Enrollment;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { CourseStatus, LessonStatus } from './course.enum';

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

  @Column({ type: 'float', default: 0 })
  progress: number;

  @Column('simple-array')
  tags: string[];
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

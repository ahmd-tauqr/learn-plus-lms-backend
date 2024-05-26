import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, Enrollment, Lesson, LessonProgress } from './course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { LessonStatus } from './course.enum';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class CoursesService {
  private logger = new Logger('Courses');
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentsRepository: Repository<Enrollment>,
    @InjectRepository(Lesson)
    private lessonsRepository: Repository<Lesson>,
    @InjectRepository(LessonProgress)
    private lessonProgressRepository: Repository<LessonProgress>,
  ) {}

  async getAllCourses(): Promise<Course[]> {
    this.logger.verbose(`Retrieving all courses`);
    return await this.coursesRepository.find({ relations: ['lessons'] });
  }

  async getCourseById(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['lessons'],
    });

    if (!course) {
      this.logger.error(`Course with ID "${id}" not found`);
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    this.logger.verbose(`Course details retrieved for "${course.title}"`);

    return course;
  }

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    const { title, description, lessons, tags } = createCourseDto;

    const course = this.coursesRepository.create({
      title,
      description,
      lessons: [],
      tags,
    });

    await this.coursesRepository.save(course);

    for (const lessonDto of lessons) {
      const lesson = this.lessonsRepository.create({
        ...lessonDto,
        course,
        status: LessonStatus.NOT_STARTED,
      });
      await this.lessonsRepository.save(lesson);
      course.lessons.push(lesson);
    }

    await this.coursesRepository.save(course);

    this.logger.verbose(`Course "${course.title}" is created`);

    return course;
  }

  async addLesson(
    id: string,
    createLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    const course = await this.getCourseById(id);

    const lesson = this.lessonsRepository.create({
      ...createLessonDto,
      course,
      status: LessonStatus.NOT_STARTED,
    });

    await this.lessonsRepository.save(lesson);
    course.lessons.push(lesson);
    await this.coursesRepository.save(course);

    const enrollments = await this.enrollmentsRepository.find({
      where: { course: { id } },
      relations: ['lessonProgress'],
    });

    for (const enrollment of enrollments) {
      const lessonProgress = this.lessonProgressRepository.create({
        enrollment,
        id: lesson.id,
        title: lesson.title,
        status: LessonStatus.NOT_STARTED,
      });
      await this.lessonProgressRepository.save(lessonProgress);
      enrollment.lessonProgress.push(lessonProgress);
      await this.enrollmentsRepository.save(enrollment);
    }

    this.logger.verbose(
      `Lesson "${createLessonDto.title}" added to course "${course.title}" and all enrollments updated`,
    );

    return lesson;
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['lessons', 'enrollments'],
    });

    if (!course) {
      this.logger.error(`Course with ID "${id}" not found`);
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    await this.coursesRepository.remove(course);
    this.logger.verbose(`Course "${course.title}" is deleted`);
  }

  async deleteLesson(id: string, lessonId: string): Promise<void> {
    const course = await this.getCourseById(id);

    const lessonIndex = course.lessons.findIndex(
      (lesson) => lesson.id === lessonId,
    );
    if (lessonIndex === -1) {
      this.logger.error(`Lesson with ID "${lessonId}" not found`);
      throw new NotFoundException(`Lesson with ID "${lessonId}" not found`);
    }

    const lesson = course.lessons[lessonIndex];
    await this.lessonsRepository.remove(lesson);

    course.lessons.splice(lessonIndex, 1);
    await this.coursesRepository.save(course);
    this.logger.verbose(
      `Lesson "${lesson.title}" is deleted from course "${course.title}"`,
    );
  }
}

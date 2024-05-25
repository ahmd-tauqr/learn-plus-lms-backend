import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, Lesson } from './course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseStatus, LessonStatus } from './course.enum';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private lessonsRepository: Repository<Lesson>,
  ) {}

  async getAllCourses(): Promise<Course[]> {
    return await this.coursesRepository.find({ relations: ['lessons'] });
  }

  async getCourseById(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['lessons'],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    return course;
  }

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    const { title, description, lessons, tags } = createCourseDto;

    const course = this.coursesRepository.create({
      title,
      description,
      status: CourseStatus.OPEN,
      lessons: [],
      progress: 0,
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

    return lesson;
  }

  async completeLesson(courseId: string, lessonId: string): Promise<Lesson> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId, course: { id: courseId } },
      relations: ['course'],
    });

    if (!lesson) {
      throw new NotFoundException(
        `Lesson with ID "${lessonId}" not found in course with ID "${courseId}"`,
      );
    }

    lesson.status = LessonStatus.COMPLETED;
    await this.lessonsRepository.save(lesson);

    const course = await this.getCourseById(courseId);
    this.updateCourseProgress(course);
    await this.coursesRepository.save(course);

    return lesson;
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['lessons'],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    // Delete all associated lessons
    await this.lessonsRepository.remove(course.lessons);

    // Delete the course
    await this.coursesRepository.remove(course);
  }

  async deleteLesson(courseId: string, lessonId: string): Promise<void> {
    const course = await this.getCourseById(courseId);

    const lessonIndex = course.lessons.findIndex(
      (lesson) => lesson.id === lessonId,
    );
    if (lessonIndex === -1) {
      throw new NotFoundException(`Lesson with ID "${lessonId}" not found`);
    }

    const lesson = course.lessons[lessonIndex];
    await this.lessonsRepository.remove(lesson);

    course.lessons.splice(lessonIndex, 1);
    this.updateCourseProgress(course);
    await this.coursesRepository.save(course);
  }

  private updateCourseProgress(course: Course) {
    if (!course.lessons) {
      course.progress = 0;
      course.status = CourseStatus.NOT_STARTED;
      return;
    }

    const completedLessons = course.lessons.filter(
      (lesson) => lesson.status === LessonStatus.COMPLETED,
    ).length;

    course.progress = (completedLessons / course.lessons.length) * 100;

    if (course.progress === 100) {
      course.status = CourseStatus.COMPLETED;
    } else if (completedLessons > 0) {
      course.status = CourseStatus.IN_PROGRESS;
    } else {
      course.status = CourseStatus.NOT_STARTED;
    }
  }
}

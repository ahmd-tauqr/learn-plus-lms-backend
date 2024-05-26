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

  async deleteCourse(id: string): Promise<void> {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['lessons', 'enrollments'],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    // Delete the course along with its lessons and enrollments
    await this.coursesRepository.remove(course);
  }

  async deleteLesson(id: string, lessonId: string): Promise<void> {
    const course = await this.getCourseById(id);

    const lessonIndex = course.lessons.findIndex(
      (lesson) => lesson.id === lessonId,
    );
    if (lessonIndex === -1) {
      throw new NotFoundException(`Lesson with ID "${lessonId}" not found`);
    }

    const lesson = course.lessons[lessonIndex];
    await this.lessonsRepository.remove(lesson);

    course.lessons.splice(lessonIndex, 1);
    await this.coursesRepository.save(course);
  }
}

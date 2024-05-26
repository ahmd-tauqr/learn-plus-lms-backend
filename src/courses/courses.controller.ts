import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  Logger,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { Course, Lesson } from './course.entity';

@Controller('courses')
export class CoursesController {
  private logger = new Logger('CoursesController');
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async getAllCourses(): Promise<Course[]> {
    this.logger.verbose(`Retrieving all courses`);
    return await this.coursesService.getAllCourses();
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string): Promise<Course> {
    this.logger.verbose(`Retrieving course with id "${id}"`);
    return await this.coursesService.getCourseById(id);
  }

  @Post()
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<Course> {
    this.logger.verbose(`Course "${createCourseDto.title}" is created`);
    return await this.coursesService.createCourse(createCourseDto);
  }

  @Post(':id/lessons')
  async addLesson(
    @Param('id') id: string,
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    this.logger.verbose(
      `Lesson "${createLessonDto.title}" is added to course Id "${id}"`,
    );
    return await this.coursesService.addLesson(id, createLessonDto);
  }

  @Delete(':id')
  async deleteCourse(@Param('id') id: string): Promise<void> {
    this.logger.verbose(`Course with Id "${id}" is deleted`);
    await this.coursesService.deleteCourse(id);
  }

  @Delete(':id/lessons/:lessonId')
  async deleteLesson(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
  ): Promise<void> {
    this.logger.verbose(
      `Lesson with Id "${lessonId}" is deleted from course Id "${id}"`,
    );
    await this.coursesService.deleteLesson(id, lessonId);
  }
}

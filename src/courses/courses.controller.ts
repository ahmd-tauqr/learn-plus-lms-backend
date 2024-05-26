import { Controller, Get, Param, Post, Body, Delete } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { Course, Lesson } from './course.entity';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async getAllCourses(): Promise<Course[]> {
    return await this.coursesService.getAllCourses();
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string): Promise<Course> {
    return await this.coursesService.getCourseById(id);
  }

  @Post()
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<Course> {
    return await this.coursesService.createCourse(createCourseDto);
  }

  @Post(':id/lessons')
  async addLesson(
    @Param('id') id: string,
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    return await this.coursesService.addLesson(id, createLessonDto);
  }

  @Delete(':id')
  async deleteCourse(@Param('id') id: string): Promise<void> {
    await this.coursesService.deleteCourse(id);
  }

  @Delete(':id/lessons/:lessonId')
  async deleteLesson(
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
  ): Promise<void> {
    await this.coursesService.deleteLesson(id, lessonId);
  }
}

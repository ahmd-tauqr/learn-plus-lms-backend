import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course, Lesson, LessonStatus } from './course.model';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { v4 as uuidv4 } from 'uuid';

@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  getAllCourses(): Course[] {
    return this.coursesService.getAllCourses();
  }

  @Post()
  createCourse(@Body() createCourseDto: CreateCourseDto): Course {
    const { title, description, lessons, tags } = createCourseDto;
    const courseId = uuidv4();
    const transformedLessons: Lesson[] = lessons.map((lesson) => ({
      ...lesson,
      id: uuidv4(),
      courseId,
      status: LessonStatus.NOT_STARTED,
    }));
    return this.coursesService.createCourse(
      title,
      description,
      transformedLessons,
      tags,
    );
  }

  @Get(':id')
  getCourseById(@Param('id') courseId: string): Course {
    return this.coursesService.getCourseById(courseId);
  }

  @Post(':courseId/lessons')
  addLesson(
    @Param('courseId') courseId: string,
    @Body() createLessonDto: CreateLessonDto,
  ): Lesson {
    const { title } = createLessonDto;
    return this.coursesService.addLesson(courseId, title);
  }

  @Patch(':courseId/lessons/:lessonId/complete')
  completeLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ): Lesson {
    return this.coursesService.completeLesson(courseId, lessonId);
  }

  @Delete(':id')
  deleteCourse(@Param('id') courseId: string): boolean {
    return this.coursesService.deleteCourse(courseId);
  }

  @Delete(':courseId/lessons/:lessonId')
  deleteLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ): boolean {
    return this.coursesService.deleteLesson(courseId, lessonId);
  }
}

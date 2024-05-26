import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  ValidationPipe,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

import { User } from './user.entity';
import { GetUser } from './get-user.decorater';
import { Enrollment } from 'src/courses/course.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signUp(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<void> {
    return this.authService.createUser(authCredentialsDto);
  }

  @Post('/signin')
  async signIn(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const accessToken = await this.authService.validateUser(authCredentialsDto);
    return { accessToken };
  }

  @Post('/enroll/:courseId')
  @UseGuards(JwtAuthGuard)
  async enrollToCourse(
    @Param('courseId') courseId: string,
    @GetUser() user: User,
  ): Promise<void> {
    await this.authService.enrollToCourse(user.username, courseId);
  }

  @Delete('/unenroll/:courseId')
  @UseGuards(JwtAuthGuard)
  async unenrollFromCourse(
    @Param('courseId') courseId: string,
    @GetUser() user: User,
  ): Promise<void> {
    await this.authService.unenrollFromCourse(user.username, courseId);
  }

  @Patch('/enrollments/:enrollmentId/progress')
  @UseGuards(JwtAuthGuard)
  async updateEnrollmentProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Body('progress') progress: number,
  ): Promise<void> {
    await this.authService.updateEnrollmentProgress(enrollmentId, progress);
  }

  @Patch('/enrollments/:enrollmentId/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  async completeLesson(
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<void> {
    await this.authService.completeLesson(enrollmentId, lessonId);
  }

  @Get('/courses')
  @UseGuards(JwtAuthGuard)
  async getEnrolledCourses(@GetUser() user: User): Promise<Enrollment[]> {
    return this.authService.getEnrolledCourses(user.username);
  }
}

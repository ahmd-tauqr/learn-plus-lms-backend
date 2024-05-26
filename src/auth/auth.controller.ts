import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from './user.entity';
import { Enrollment } from 'src/courses/course.entity';
import { GetUser } from './get-user.decorater';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.authService.createUser(authCredentialsDto);
  }

  @Post('/signin')
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
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

  @Get('/enrollments')
  @UseGuards(JwtAuthGuard)
  async getEnrollments(@GetUser() user: User): Promise<Enrollment[]> {
    return this.authService.getEnrollments(user.username);
  }

  @Get('/enrollments/:enrollmentId')
  @UseGuards(JwtAuthGuard)
  async getEnrollmentDetails(
    @Param('enrollmentId') enrollmentId: string,
  ): Promise<Enrollment> {
    return this.authService.getEnrollmentDetails(enrollmentId);
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
}

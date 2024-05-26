import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from './user.entity';
import { Enrollment } from 'src/courses/course.entity';
import { GetUser } from './get-user.decorater';

@Controller('auth')
export class AuthController {
  private logger = new Logger('CoursesController');
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<void> {
    this.logger.verbose(`User "${authCredentialsDto.username}" signed up`);
    return this.authService.createUser(authCredentialsDto);
  }

  @Post('/signin')
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    this.logger.verbose(`User "${authCredentialsDto.username}" signed in`);
    const accessToken = await this.authService.validateUser(authCredentialsDto);
    return { accessToken };
  }

  @Post('/enroll/:courseId')
  @UseGuards(JwtAuthGuard)
  async enrollToCourse(
    @Param('courseId') courseId: string,
    @GetUser() user: User,
  ): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" enrolled to course Id "${courseId}"`,
    );
    await this.authService.enrollToCourse(user.username, courseId);
  }

  @Delete('/unenroll/:courseId')
  @UseGuards(JwtAuthGuard)
  async unenrollFromCourse(
    @Param('courseId') courseId: string,
    @GetUser() user: User,
  ): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" unenrolled from course Id "${courseId}"`,
    );
    await this.authService.unenrollFromCourse(user.username, courseId);
  }

  @Get('/enrollments')
  @UseGuards(JwtAuthGuard)
  async getEnrollments(@GetUser() user: User): Promise<Enrollment[]> {
    this.logger.verbose(`User "${user.username}" retrieving enrollments`);
    return this.authService.getEnrollments(user.username);
  }

  @Get('/enrollments/:enrollmentId')
  @UseGuards(JwtAuthGuard)
  async getEnrollmentDetails(
    @Param('enrollmentId') enrollmentId: string,
    @GetUser() user: User,
  ): Promise<Enrollment> {
    this.logger.verbose(
      `User "${user.username}" retrieving enrollment details for Id "${enrollmentId}"`,
    );
    return this.authService.getEnrollmentDetails(user.username, enrollmentId);
  }

  @Patch('/enrollments/:enrollmentId/progress')
  @UseGuards(JwtAuthGuard)
  async updateEnrollmentProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Body('progress') progress: number,
    @GetUser() user: User,
  ): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" updating progress for enrollment Id "${enrollmentId}" to "${progress}"`,
    );
    await this.authService.updateEnrollmentProgress(
      user.username,
      enrollmentId,
      progress,
    );
  }

  @Patch('/enrollments/:enrollmentId/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  async completeLesson(
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
    @GetUser() user: User,
  ): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" completing lesson Id "${lessonId}" for enrollment Id "${enrollmentId}"`,
    );
    await this.authService.completeLesson(
      user.username,
      enrollmentId,
      lessonId,
    );
  }
}

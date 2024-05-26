import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from './user.entity';
import { Enrollment } from 'src/courses/course.entity';
import { GetUser } from './get-user.decorater';
import { UpdateEnrollmentProgressDto } from 'src/courses/dto/update-enrollment-progress.dto';
import { Response } from 'express';

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
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.validateUser(authCredentialsDto, res);
    res.status(200).json({ message: 'Signin successful' });
  }

  @Post('/enroll/:courseId')
  @UseGuards(JwtAuthGuard)
  async enrollToCourse(
    @Param('courseId') courseId: string,
    @GetUser() user: User,
  ): Promise<void> {
    await this.authService.enrollToCourse(user.username, courseId);
  }

  @Delete('/unenroll/:enrollmentId')
  @UseGuards(JwtAuthGuard)
  async unenrollFromCourse(
    @Param('enrollmentId') enrollmentId: string,
    @GetUser() user: User,
  ): Promise<void> {
    await this.authService.unenrollFromCourse(user.username, enrollmentId);
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
    @GetUser() user: User,
  ): Promise<Enrollment> {
    return this.authService.getEnrollmentDetails(user.username, enrollmentId);
  }

  @Patch('/enrollments/:enrollmentId/progress')
  @UseGuards(JwtAuthGuard)
  async updateEnrollmentProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Body() updateEnrollmentProgressDto: UpdateEnrollmentProgressDto,
    @GetUser() user: User,
  ): Promise<void> {
    await this.authService.updateEnrollmentProgress(
      user.username,
      enrollmentId,
      updateEnrollmentProgressDto.progress,
    );
  }

  @Patch('/enrollments/:enrollmentId/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  async completeLesson(
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
    @GetUser() user: User,
  ): Promise<void> {
    await this.authService.completeLesson(
      user.username,
      enrollmentId,
      lessonId,
    );
  }
}

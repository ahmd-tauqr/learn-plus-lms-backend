import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  ValidationPipe,
  Param,
  UseGuards,
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

  @Get('/courses')
  @UseGuards(JwtAuthGuard)
  async getEnrolledCourses(@GetUser() user: User): Promise<Enrollment[]> {
    return this.authService.getEnrolledCourses(user.username);
  }
}

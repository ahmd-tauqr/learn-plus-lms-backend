import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import {
  Course,
  Enrollment,
  Lesson,
  LessonProgress,
} from 'src/courses/course.entity';
import { EnrollmentStatus, LessonStatus } from 'src/courses/course.enum';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonProgress)
    private lessonProgressRepository: Repository<LessonProgress>,
    private jwtService: JwtService,
  ) {}

  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = authCredentialsDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      enrollments: [],
    });

    try {
      await this.userRepository.save(user);
      this.logger.verbose(`User "${user.username}" signed up`);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async validateUser(
    authCredentialsDto: AuthCredentialsDto,
    res: Response,
  ): Promise<void> {
    const { username, password } = authCredentialsDto;
    const user = await this.userRepository.findOne({ where: { username } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload = { username };
      const accessToken = await this.jwtService.sign(payload);
      this.logger.verbose(`User "${user.username}" signed in`);
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshToken(refreshToken: string, res: Response): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const { username } = payload;

      const newAccessToken = this.jwtService.sign(
        { username },
        { expiresIn: '1h' },
      );
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });

      this.logger.verbose(`Access token refreshed for user "${username}"`);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async enrollToCourse(username: string, courseId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['enrollments'],
    });

    if (!user) {
      this.logger.error(`User "${username}" not found`);
      throw new NotFoundException(`User "${username}" not found`);
    }

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['lessons'],
    });

    if (!course) {
      this.logger.error(`Course with ID "${courseId}" not found`);
      throw new NotFoundException(`Course with ID "${courseId}" not found`);
    }

    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { user: { id: user.id }, course: { id: course.id } },
    });

    if (existingEnrollment) {
      throw new ConflictException('User is already enrolled in this course');
    }

    const enrollment = this.enrollmentRepository.create({
      user,
      course,
      progress: 0,
      status: EnrollmentStatus.NOT_STARTED,
      lessonProgress: [],
    });

    await this.enrollmentRepository.save(enrollment);

    for (const lesson of course.lessons) {
      const lessonProgress = this.lessonProgressRepository.create({
        enrollment,
        id: lesson.id,
        title: lesson.title,
        status: LessonStatus.NOT_STARTED,
      });
      await this.lessonProgressRepository.save(lessonProgress);
      enrollment.lessonProgress.push(lessonProgress);
    }

    await this.enrollmentRepository.save(enrollment);

    course.enrollmentsCount += 1;
    await this.courseRepository.save(course);

    this.logger.verbose(
      `User "${user.username}" enrolled to course "${course.title}"`,
    );
  }

  async unenrollFromCourse(
    username: string,
    enrollmentId: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['enrollments', 'enrollments.course'],
    });

    if (!user) {
      this.logger.error(`User "${username}" not found`);
      throw new NotFoundException(`User "${username}" not found`);
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId, user: { id: user.id } },
      relations: ['course'],
    });

    if (!enrollment) {
      this.logger.error(
        `Enrollment with ID "${enrollmentId}" not found for user "${username}"`,
      );
      throw new NotFoundException('User is not enrolled in this course');
    }

    const course = enrollment.course;

    await this.enrollmentRepository.remove(enrollment);

    course.enrollmentsCount -= 1;
    await this.courseRepository.save(course);

    this.logger.verbose(
      `User "${user.username}" unenrolled from course "${course.title}"`,
    );
  }

  async getEnrollments(username: string): Promise<Enrollment[]> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['enrollments', 'enrollments.course'],
    });

    if (!user) {
      this.logger.error(`User "${username}" not found`);
      throw new NotFoundException(`User "${username}" not found`);
    }

    this.logger.verbose(`User "${user.username}" retrieving enrollments`);

    return user.enrollments;
  }

  async getEnrollmentDetails(
    username: string,
    id: string,
  ): Promise<Enrollment> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      this.logger.error(`User "${username}" not found`);
      throw new NotFoundException(`User "${username}" not found`);
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['course', 'course.lessons', 'lessonProgress'],
    });

    if (!enrollment) {
      this.logger.error(`Enrollment with ID "${id}" not found`);
      throw new NotFoundException(`Enrollment with ID "${id}" not found`);
    }
    this.logger.verbose(
      `User "${user.username}" retrieving enrollment details for "${enrollment.course.title}"`,
    );
    return enrollment;
  }

  async updateEnrollmentProgress(
    username: string,
    enrollmentId: string,
    progress: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['enrollments', 'enrollments.course'],
    });
    if (!user) {
      this.logger.error(`User "${username}" not found`);
      throw new NotFoundException(`User "${username}" not found`);
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId, user: { id: user.id } },
      relations: ['course'],
    });

    if (!enrollment) {
      this.logger.error(`Enrollment for course not found`);
      throw new NotFoundException(
        `Enrollment with ID "${enrollmentId}" not found`,
      );
    }

    enrollment.progress = progress;
    await this.enrollmentRepository.save(enrollment);

    this.logger.verbose(
      `User "${user.username}" updated progress for enrollment "${enrollmentId}" to ${progress}%`,
    );
  }

  async completeLesson(
    username: string,
    enrollmentId: string,
    lessonId: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['enrollments', 'enrollments.course'],
    });
    if (!user) {
      this.logger.error(`User "${username}" not found`);
      throw new NotFoundException(`User "${username}" not found`);
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId, user: { id: user.id } },
      relations: ['course', 'course.lessons', 'lessonProgress'],
    });

    if (!enrollment) {
      this.logger.error(`Enrollment for course not found`);
      throw new NotFoundException(
        `Enrollment with ID "${enrollmentId}" not found`,
      );
    }

    const lessonProgress = enrollment.lessonProgress.find(
      (lp) => lp.id === lessonId,
    );

    if (!lessonProgress) {
      this.logger.error(
        `LessonProgress with lesson ID "${lessonId}" not found`,
      );
      throw new NotFoundException(
        `LessonProgress with lesson ID "${lessonId}" not found`,
      );
    }

    lessonProgress.status = LessonStatus.COMPLETED;
    await this.lessonProgressRepository.save(lessonProgress);

    const totalLessons = enrollment.course.lessons.length;
    const completedLessons = enrollment.lessonProgress.filter(
      (lp) => lp.status === LessonStatus.COMPLETED,
    ).length;

    enrollment.progress = Math.round((completedLessons / totalLessons) * 100);

    if (completedLessons === totalLessons) {
      enrollment.status = EnrollmentStatus.COMPLETED;
    } else if (completedLessons > 0) {
      enrollment.status = EnrollmentStatus.IN_PROGRESS;
    }

    await this.enrollmentRepository.save(enrollment);
    this.logger.verbose(
      `User "${user.username}" completed lesson with ID "${lessonId}" for enrollment "${enrollment.course.title}"`,
    );
  }
}

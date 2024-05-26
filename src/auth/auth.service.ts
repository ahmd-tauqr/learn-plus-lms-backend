import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Course, Enrollment, Lesson } from 'src/courses/course.entity';
import { LessonStatus } from 'src/courses/course.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
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
    } catch (error) {
      if (error.code === '23505') {
        // postgres code for duplicate user
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async validateUser(authCredentialsDto: AuthCredentialsDto): Promise<string> {
    const { username, password } = authCredentialsDto;
    const user = await this.userRepository.findOne({ where: { username } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload = { username };
      const accessToken = await this.jwtService.sign(payload);
      return accessToken;
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async enrollToCourse(username: string, id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['enrollments'],
    });

    if (!user) {
      throw new NotFoundException(`User with username "${username}" not found`);
    }

    const course = await this.courseRepository.findOne({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { user, course },
    });

    if (existingEnrollment) {
      throw new ConflictException('User is already enrolled in this course');
    }

    const enrollment = this.enrollmentRepository.create({
      user,
      course,
      progress: 0,
    });

    await this.enrollmentRepository.save(enrollment);

    course.enrollmentsCount += 1;
    await this.courseRepository.save(course);
  }

  async unenrollFromCourse(username: string, id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['enrollments'],
    });

    if (!user) {
      throw new NotFoundException(`User with username "${username}" not found`);
    }

    const course = await this.courseRepository.findOne({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: { user, course },
    });

    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    await this.enrollmentRepository.remove(enrollment);

    course.enrollmentsCount -= 1;
    await this.courseRepository.save(course);
  }

  async getEnrolledCourses(username: string): Promise<Enrollment[]> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['enrollments', 'enrollments.course'],
    });

    if (!user) {
      throw new NotFoundException(`User with username "${username}" not found`);
    }

    return user.enrollments;
  }

  async updateEnrollmentProgress(id: string, progress: number): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID "${id}" not found`);
    }

    enrollment.progress = progress;
    await this.enrollmentRepository.save(enrollment);
  }

  async completeLesson(id: string, lessonId: string): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: id },
      relations: ['course', 'user'],
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID "${id}" not found`);
    }

    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId, course: enrollment.course },
    });

    if (!lesson) {
      throw new NotFoundException(
        `Lesson with ID "${lessonId}" not found in the course`,
      );
    }

    lesson.status = LessonStatus.COMPLETED;
    await this.lessonRepository.save(lesson);

    const totalLessons = await this.lessonRepository.count({
      where: { course: enrollment.course },
    });
    const completedLessons = await this.lessonRepository.count({
      where: { course: enrollment.course, status: LessonStatus.COMPLETED },
    });

    enrollment.progress = (completedLessons / totalLessons) * 100;
    await this.enrollmentRepository.save(enrollment);
  }
}

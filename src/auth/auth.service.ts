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
import { Course, Enrollment } from 'src/courses/course.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
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
      console.log(error.code);
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
}

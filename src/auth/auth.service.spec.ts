import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import {
  Course,
  Enrollment,
  Lesson,
  LessonProgress,
} from 'src/courses/course.entity';
import { Repository } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { mock, MockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { EnrollmentStatus, LessonStatus } from 'src/courses/course.enum';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: MockProxy<Repository<User>>;
  let courseRepository: MockProxy<Repository<Course>>;
  let enrollmentRepository: MockProxy<Repository<Enrollment>>;
  let lessonRepository: MockProxy<Repository<Lesson>>;
  let lessonProgressRepository: MockProxy<Repository<LessonProgress>>;
  let jwtService: MockProxy<JwtService>;

  beforeEach(async () => {
    userRepository = mock<Repository<User>>();
    courseRepository = mock<Repository<Course>>();
    enrollmentRepository = mock<Repository<Enrollment>>();
    lessonRepository = mock<Repository<Lesson>>();
    lessonProgressRepository = mock<Repository<LessonProgress>>();
    jwtService = mock<JwtService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Course), useValue: courseRepository },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: enrollmentRepository,
        },
        { provide: getRepositoryToken(Lesson), useValue: lessonRepository },
        {
          provide: getRepositoryToken(LessonProgress),
          useValue: lessonProgressRepository,
        },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const authCredentialsDto: AuthCredentialsDto = {
        username: 'testuser',
        password: 'password',
      };

      userRepository.create.mockReturnValue({
        username: 'testuser',
        password: 'hashedpassword',
        enrollments: [],
      } as User);

      userRepository.save.mockResolvedValue(undefined);

      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt');
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword');

      await service.createUser(authCredentialsDto);

      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw a ConflictException if username already exists', async () => {
      const authCredentialsDto: AuthCredentialsDto = {
        username: 'testuser',
        password: 'password',
      };

      userRepository.save.mockRejectedValue({ code: '23505' });

      await expect(service.createUser(authCredentialsDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should validate user successfully and set cookie', async () => {
      const authCredentialsDto: AuthCredentialsDto = {
        username: 'testuser',
        password: 'password',
      };
      const user = { username: 'testuser', password: 'hashedpassword' } as User;
      const response = {
        cookie: jest.fn(),
      } as unknown as Response;

      userRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jwtService.sign.mockReturnValue('accessToken');

      await service.validateUser(authCredentialsDto, response);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(response.cookie).toHaveBeenCalledWith(
        'accessToken',
        'accessToken',
        {
          httpOnly: true,
          secure: false,
        },
      );
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const authCredentialsDto: AuthCredentialsDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };
      const user = { username: 'testuser', password: 'hashedpassword' } as User;
      const response = {} as unknown as Response;

      userRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        service.validateUser(authCredentialsDto, response),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('enrollToCourse', () => {
    it('should enroll user to a course successfully', async () => {
      const username = 'testuser';
      const courseId = 'courseId';
      const user = { id: 'userId', username, enrollments: [] } as User;
      const course = {
        id: courseId,
        lessons: [],
        enrollmentsCount: 0,
      } as Course;

      userRepository.findOne.mockResolvedValue(user);
      courseRepository.findOne.mockResolvedValue(course);
      enrollmentRepository.findOne.mockResolvedValue(null);

      await service.enrollToCourse(username, courseId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username },
        relations: ['enrollments'],
      });
      expect(courseRepository.findOne).toHaveBeenCalledWith({
        where: { id: courseId },
        relations: ['lessons'],
      });
      expect(enrollmentRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user is already enrolled', async () => {
      const username = 'testuser';
      const courseId = 'courseId';
      const user = { id: 'userId', username, enrollments: [] } as User;
      const course = {
        id: courseId,
        lessons: [],
        enrollmentsCount: 0,
      } as Course;
      const enrollment = { id: 'enrollmentId' } as Enrollment;

      userRepository.findOne.mockResolvedValue(user);
      courseRepository.findOne.mockResolvedValue(course);
      enrollmentRepository.findOne.mockResolvedValue(enrollment);

      await expect(service.enrollToCourse(username, courseId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.enrollToCourse('testuser', 'courseId'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if course not found', async () => {
      const user = {
        id: 'userId',
        username: 'testuser',
        enrollments: [],
      } as User;

      userRepository.findOne.mockResolvedValue(user);
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.enrollToCourse('testuser', 'courseId'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unenrollFromCourse', () => {
    it('should unenroll user from a course successfully', async () => {
      const username = 'testuser';
      const enrollmentId = 'enrollmentId';
      const user = { id: 'userId', username, enrollments: [] } as User;
      const enrollment = {
        id: enrollmentId,
        course: { id: 'courseId' },
      } as Enrollment;

      userRepository.findOne.mockResolvedValue(user);
      enrollmentRepository.findOne.mockResolvedValue(enrollment);

      await service.unenrollFromCourse(username, enrollmentId);

      expect(enrollmentRepository.remove).toHaveBeenCalledWith(enrollment);
      expect(courseRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.unenrollFromCourse('testuser', 'enrollmentId'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      const user = {
        id: 'userId',
        username: 'testuser',
        enrollments: [],
      } as User;

      userRepository.findOne.mockResolvedValue(user);
      enrollmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.unenrollFromCourse('testuser', 'enrollmentId'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEnrollments', () => {
    const mockEnrollment = {
      id: 'enrollmentId',
      course: { id: 'courseId', title: 'Course Title' },
      progress: 0,
      status: EnrollmentStatus.NOT_STARTED,
      lessonProgress: [],
    } as Enrollment;

    it('should retrieve all enrollments for a user', async () => {
      const username = 'testuser';
      const user = {
        id: 'userId',
        username,
        enrollments: [mockEnrollment],
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getEnrollments(username);

      expect(result).toEqual(user.enrollments);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username },
        relations: ['enrollments', 'enrollments.course'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getEnrollments('testuser')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEnrollmentDetails', () => {
    it('should retrieve enrollment details for a user', async () => {
      const username = 'testuser';
      const enrollmentId = 'enrollmentId';
      const user = { id: 'userId', username } as User;
      const course = { id: 'courseId', title: 'Test Course' } as Course;
      const enrollment = { id: enrollmentId, course } as Enrollment;

      userRepository.findOne.mockResolvedValue(user);
      enrollmentRepository.findOne.mockResolvedValue(enrollment);

      const result = await service.getEnrollmentDetails(username, enrollmentId);

      expect(result).toEqual(enrollment);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(enrollmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: enrollmentId, user: { id: user.id } },
        relations: ['course', 'course.lessons', 'lessonProgress'],
      });
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      const username = 'testuser';
      const enrollmentId = 'enrollmentId';
      const user = { id: 'userId', username } as User;

      userRepository.findOne.mockResolvedValue(user);
      enrollmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getEnrollmentDetails(username, enrollmentId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeLesson', () => {
    it('should complete a lesson successfully', async () => {
      const username = 'testuser';
      const enrollmentId = 'enrollmentId';
      const lessonId = 'lessonId';
      const user = { id: 'userId', username } as User;
      const lessonProgress = {
        id: lessonId,
        status: LessonStatus.NOT_STARTED,
      } as LessonProgress;
      const enrollment = {
        id: enrollmentId,
        course: { lessons: [{ id: lessonId }] },
        lessonProgress: [lessonProgress],
      } as Enrollment;

      userRepository.findOne.mockResolvedValue(user);
      enrollmentRepository.findOne.mockResolvedValue(enrollment);

      await service.completeLesson(username, enrollmentId, lessonId);

      expect(lessonProgress.status).toBe(LessonStatus.COMPLETED);
      expect(lessonProgressRepository.save).toHaveBeenCalledWith(
        lessonProgress,
      );
      expect(enrollmentRepository.save).toHaveBeenCalledWith(enrollment);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completeLesson('testuser', 'enrollmentId', 'lessonId'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      const user = { id: 'userId', username: 'testuser' } as User;

      userRepository.findOne.mockResolvedValue(user);
      enrollmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completeLesson('testuser', 'enrollmentId', 'lessonId'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if lesson progress not found', async () => {
      const username = 'testuser';
      const enrollmentId = 'enrollmentId';
      const lessonId = 'lessonId';
      const user = { id: 'userId', username } as User;
      const enrollment = {
        id: enrollmentId,
        course: { lessons: [{ id: lessonId }] },
        lessonProgress: [],
      } as Enrollment;

      userRepository.findOne.mockResolvedValue(user);
      enrollmentRepository.findOne.mockResolvedValue(enrollment);

      await expect(
        service.completeLesson(username, enrollmentId, lessonId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEnrollmentProgress', () => {
    it('should update enrollment progress successfully', async () => {
      const username = 'testuser';
      const enrollmentId = 'enrollmentId';
      const progress = 50;
      const user = { id: 'userId', username } as User;
      const enrollment = { id: enrollmentId, progress: 0 } as Enrollment;

      userRepository.findOne.mockResolvedValue(user);
      enrollmentRepository.findOne.mockResolvedValue(enrollment);

      await service.updateEnrollmentProgress(username, enrollmentId, progress);

      expect(enrollment.progress).toBe(progress);
      expect(enrollmentRepository.save).toHaveBeenCalledWith(enrollment);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateEnrollmentProgress('testuser', 'enrollmentId', 50),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      const user = { id: 'userId', username: 'testuser' } as User;

      userRepository.findOne.mockResolvedValue(user);
      enrollmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateEnrollmentProgress('testuser', 'enrollmentId', 50),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

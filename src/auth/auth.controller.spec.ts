import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from './user.entity';
import { Enrollment } from 'src/courses/course.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ExecutionContext } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { UpdateEnrollmentProgressDto } from 'src/courses/dto/update-enrollment-progress.dto';
import { Reflector } from '@nestjs/core';
import { EnrollmentStatus } from 'src/courses/course.enum';
import { Repository } from 'typeorm';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: MockProxy<AuthService>;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    password: 'hashedpassword',
    enrollments: [],
  };

  const mockEnrollment: Enrollment = {
    id: '1',
    progress: 0,
    status: EnrollmentStatus.NOT_STARTED,
    user: mockUser,
    course: null,
    lessonProgress: [],
  };

  beforeEach(async () => {
    authService = mock<AuthService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: getRepositoryToken(User),
          useValue: mock<MockProxy<Repository<User>>>(),
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mock<MockProxy<Repository<Enrollment>>>(),
        },
        { provide: JwtService, useValue: mock<JwtService>() },
        Reflector,
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn((context: ExecutionContext) => {
              const request = context.switchToHttp().getRequest();
              request.user = mockUser;
              return true;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should sign up a user', async () => {
      const authCredentialsDto: AuthCredentialsDto = {
        username: 'testuser',
        password: 'password',
      };
      authService.createUser.mockResolvedValue(undefined);

      await expect(
        controller.signUp(authCredentialsDto),
      ).resolves.toBeUndefined();
      expect(authService.createUser).toHaveBeenCalledWith(authCredentialsDto);
    });
  });

  describe('signIn', () => {
    it('should sign in a user and set cookie', async () => {
      const authCredentialsDto: AuthCredentialsDto = {
        username: 'testuser',
        password: 'password',
      };
      const response = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      authService.validateUser.mockImplementation(async (dto, res) => {
        res.cookie('accessToken', 'accessToken', {
          httpOnly: true,
          secure: false,
        });
      });

      await controller.signIn(authCredentialsDto, response);

      expect(authService.validateUser).toHaveBeenCalledWith(
        authCredentialsDto,
        response,
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        message: 'Signin successful',
      });
    });
  });

  describe('enrollToCourse', () => {
    it('should enroll user to a course', async () => {
      const courseId = 'courseId';

      await expect(
        controller.enrollToCourse(courseId, mockUser),
      ).resolves.toBeUndefined();
      expect(authService.enrollToCourse).toHaveBeenCalledWith(
        mockUser.username,
        courseId,
      );
    });
  });

  describe('unenrollFromCourse', () => {
    it('should unenroll user from a course', async () => {
      const enrollmentId = 'enrollmentId';

      await expect(
        controller.unenrollFromCourse(enrollmentId, mockUser),
      ).resolves.toBeUndefined();
      expect(authService.unenrollFromCourse).toHaveBeenCalledWith(
        mockUser.username,
        enrollmentId,
      );
    });
  });

  describe('getEnrollments', () => {
    it('should get user enrollments', async () => {
      authService.getEnrollments.mockResolvedValue([mockEnrollment]);

      await expect(controller.getEnrollments(mockUser)).resolves.toEqual([
        mockEnrollment,
      ]);
      expect(authService.getEnrollments).toHaveBeenCalledWith(
        mockUser.username,
      );
    });
  });

  describe('getEnrollmentDetails', () => {
    it('should get enrollment details', async () => {
      authService.getEnrollmentDetails.mockResolvedValue(mockEnrollment);

      await expect(
        controller.getEnrollmentDetails('1', mockUser),
      ).resolves.toEqual(mockEnrollment);
      expect(authService.getEnrollmentDetails).toHaveBeenCalledWith(
        mockUser.username,
        '1',
      );
    });
  });

  describe('updateEnrollmentProgress', () => {
    it('should update enrollment progress', async () => {
      const updateEnrollmentProgressDto: UpdateEnrollmentProgressDto = {
        progress: 50,
      };

      await expect(
        controller.updateEnrollmentProgress(
          '1',
          updateEnrollmentProgressDto,
          mockUser,
        ),
      ).resolves.toBeUndefined();
      expect(authService.updateEnrollmentProgress).toHaveBeenCalledWith(
        mockUser.username,
        '1',
        50,
      );
    });
  });

  describe('completeLesson', () => {
    it('should complete a lesson', async () => {
      await expect(
        controller.completeLesson('1', '1', mockUser),
      ).resolves.toBeUndefined();
      expect(authService.completeLesson).toHaveBeenCalledWith(
        mockUser.username,
        '1',
        '1',
      );
    });
  });
});

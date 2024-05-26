import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Course, Enrollment, Lesson, LessonProgress } from './course.entity';
import { Repository } from 'typeorm';
import { mock, MockProxy } from 'jest-mock-extended';

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepository: MockProxy<Repository<Course>>;
  let enrollmentRepository: MockProxy<Repository<Enrollment>>;
  let lessonRepository: MockProxy<Repository<Lesson>>;
  let lessonProgressRepository: MockProxy<Repository<LessonProgress>>;

  beforeEach(async () => {
    courseRepository = mock<Repository<Course>>();
    enrollmentRepository = mock<Repository<Enrollment>>();
    lessonRepository = mock<Repository<Lesson>>();
    lessonProgressRepository = mock<Repository<LessonProgress>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
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
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

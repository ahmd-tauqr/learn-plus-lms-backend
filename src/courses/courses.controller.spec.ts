import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from '../../src/courses/courses.controller';
import { CoursesService } from '../../src/courses/courses.service';
import { CreateCourseDto } from '../../src/courses/dto/create-course.dto';
import { CreateLessonDto } from '../../src/courses/dto/create-lesson.dto';
import { Course, Lesson } from '../../src/courses/course.entity';
import { mock, mockReset } from 'jest-mock-extended';

describe('CoursesController', () => {
  let coursesController: CoursesController;
  let coursesService: CoursesService;

  beforeEach(async () => {
    const coursesServiceMock = mock<CoursesService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: coursesServiceMock,
        },
      ],
    }).compile();

    coursesController = module.get<CoursesController>(CoursesController);
    coursesService = module.get<CoursesService>(CoursesService);
  });

  afterEach(() => {
    mockReset(coursesService);
  });

  describe('getAllCourses', () => {
    it('should return all courses', async () => {
      const courses = [new Course()] as Course[];

      (coursesService.getAllCourses as jest.Mock).mockReturnValue(courses);

      const result = await coursesController.getAllCourses();

      expect(coursesService.getAllCourses).toHaveBeenCalled();
      expect(result).toBe(courses);
    });
  });

  describe('getCourseById', () => {
    it('should return a course by ID', async () => {
      const courseId = 'courseId';
      const course = new Course();

      (coursesService.getCourseById as jest.Mock).mockReturnValue(course);

      const result = await coursesController.getCourseById(courseId);

      expect(coursesService.getCourseById).toHaveBeenCalledWith(courseId);
      expect(result).toBe(course);
    });
  });

  describe('createCourse', () => {
    it('should create a new course', async () => {
      const createCourseDto: CreateCourseDto = {
        title: 'New Course',
        description: 'Course description',
        tags: ['tag1', 'tag2'],
        lessons: [],
      };
      const course = new Course();

      (coursesService.createCourse as jest.Mock).mockReturnValue(course);

      const result = await coursesController.createCourse(createCourseDto);

      expect(coursesService.createCourse).toHaveBeenCalledWith(createCourseDto);
      expect(result).toBe(course);
    });
  });

  describe('addLesson', () => {
    it('should add a lesson to a course', async () => {
      const courseId = 'courseId';
      const createLessonDto: CreateLessonDto = { title: 'New Lesson' };
      const lesson = new Lesson();

      (coursesService.addLesson as jest.Mock).mockReturnValue(lesson);

      const result = await coursesController.addLesson(
        courseId,
        createLessonDto,
      );

      expect(coursesService.addLesson).toHaveBeenCalledWith(
        courseId,
        createLessonDto,
      );
      expect(result).toBe(lesson);
    });
  });

  describe('deleteCourse', () => {
    it('should delete a course by ID', async () => {
      const courseId = 'courseId';

      await coursesController.deleteCourse(courseId);

      expect(coursesService.deleteCourse).toHaveBeenCalledWith(courseId);
    });
  });

  describe('deleteLesson', () => {
    it('should delete a lesson by ID', async () => {
      const courseId = 'courseId';
      const lessonId = 'lessonId';

      await coursesController.deleteLesson(courseId, lessonId);

      expect(coursesService.deleteLesson).toHaveBeenCalledWith(
        courseId,
        lessonId,
      );
    });
  });
});

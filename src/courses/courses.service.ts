import { Injectable } from '@nestjs/common';
import { Course, CourseStatus, Lesson, LessonStatus } from './course.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CoursesService {
  private courses: Course[] = [];

  getAllCourses(): Course[] {
    return this.courses;
  }

  createCourse(title: string, description: string, lessons: Lesson[]): Course {
    const courseId = uuidv4();
    const course: Course = {
      id: courseId,
      title,
      description,
      status: CourseStatus.OPEN,
      lessons: lessons.map((lesson) => ({
        ...lesson,
        id: uuidv4(),
        courseId,
        status: LessonStatus.NOT_STARTED,
      })),
      progress: 0,
    };

    this.courses.push(course);
    this.updateCourseProgress(course);

    return course;
  }

  getCourseById(courseId: string): Course {
    return this.courses.find((course) => course.id === courseId);
  }

  addLesson(courseId: string, title: string): Lesson {
    const lesson: Lesson = {
      id: uuidv4(),
      courseId,
      title,
      status: LessonStatus.NOT_STARTED,
    };
    const course = this.courses.find((course) => course.id === courseId);
    if (course) {
      course.lessons.push(lesson);
      this.updateCourseProgress(course);
    }
    return lesson;
  }

  completeLesson(courseId: string, lessonId: string): Lesson {
    const course = this.courses.find((course) => course.id === courseId);
    if (course) {
      const lesson = course.lessons.find((lesson) => lesson.id === lessonId);
      if (lesson) {
        lesson.status = LessonStatus.COMPLETED;
        this.updateCourseProgress(course);
        return lesson;
      }
    }
    return null;
  }

  private updateCourseProgress(course: Course) {
    const completedLessons = course.lessons.filter(
      (lesson) => lesson.status === LessonStatus.COMPLETED,
    ).length;

    course.progress = (completedLessons / course.lessons.length) * 100;

    if (course.progress === 100) {
      course.status = CourseStatus.COMPLETED;
    } else if (completedLessons > 0) {
      course.status = CourseStatus.IN_PROGRESS;
    } else {
      course.status = CourseStatus.OPEN;
    }
  }
}

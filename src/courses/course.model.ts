export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  status: CourseStatus;
  progress: number;
}

export enum CourseStatus {
  OPEN = 'OPEN',
  ENROLLED = 'ENROLLED',
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  status: LessonStatus;
}

export enum LessonStatus {
  NOT_STARTED = 'NOT_STARTED',
  COMPLETED = 'COMPLETED',
}

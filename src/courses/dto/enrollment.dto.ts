import { IsUUID } from 'class-validator';

export class EnrollmentDto {
  @IsUUID()
  courseId: string;
}

import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLessonDto } from './create-lesson.dto';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  lessons: CreateLessonDto[];
}

import { IsString, IsNotEmpty } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}

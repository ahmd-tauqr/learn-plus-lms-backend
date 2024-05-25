import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course, Lesson } from './course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Lesson])],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}

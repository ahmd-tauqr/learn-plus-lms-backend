import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course, Enrollment, Lesson, LessonProgress } from './course.entity';
import { ConfigModule } from '@nestjs/config';
import { SeedService } from 'src/database/seed';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Course, Enrollment, Lesson, LessonProgress]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService, SeedService],
})
export class CoursesModule {}

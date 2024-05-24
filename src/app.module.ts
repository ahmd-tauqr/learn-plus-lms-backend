import { Module } from '@nestjs/common';
import { CoursesModule } from './courses/courses.module';
import { LessonsModule } from './lessons/lessons.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [CoursesModule, LessonsModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

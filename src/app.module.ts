import { Module } from '@nestjs/common';
import { CoursesModule } from './courses/courses.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [CoursesModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { CoursesModule } from './courses/courses.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    CoursesModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Bliv2xl@pgs#',
      database: 'learn-plus-lms',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

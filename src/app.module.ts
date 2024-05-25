import { Module } from '@nestjs/common';
import { CoursesModule } from './courses/courses.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
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
    AuthModule,
    CoursesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

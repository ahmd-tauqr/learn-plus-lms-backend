import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { CoursesModule } from 'src/courses/courses.module';
import { Course, Enrollment } from 'src/courses/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Course, Enrollment]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'topSecretArea51',
      signOptions: {
        expiresIn: 3600,
      },
    }),
    CoursesModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}

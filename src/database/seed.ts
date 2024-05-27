import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, Lesson } from '../courses/course.entity';
import { faker } from '@faker-js/faker';
import { LessonStatus } from 'src/courses/course.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
  ) {}

  async onModuleInit() {
    const count = await this.courseRepository.count();
    if (count === 0) {
      this.logger.log('Seeding the database with initial courses and lessons');
      for (let i = 1; i <= 10; i++) {
        const course = this.courseRepository.create({
          title: `Course Title ${i}`,
          description: faker.lorem.paragraph(),
          tags: [faker.word.sample(), faker.word.sample()],
        });

        await this.courseRepository.save(course);

        for (let j = 1; j <= 5; j++) {
          const lesson = this.lessonRepository.create({
            title: `Lesson ${j}: ${faker.lorem.sentence()}`,
            status: LessonStatus.NOT_STARTED,
            course,
          });

          await this.lessonRepository.save(lesson);
        }
      }
      this.logger.log('Seeding completed');
    } else {
      this.logger.log('Database already seeded');
    }
  }
}

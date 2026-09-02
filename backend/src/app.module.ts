import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import {
  I18nModule,
  HeaderResolver,
  AcceptLanguageResolver,
} from 'nestjs-i18n';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { YearModule } from './year/year.module';
import { SemesterModule } from './semester/semester.module';
import { SubjectModule } from './subject/subject.module';
import { CourseModule } from './course/course.module';
import { ExamModule } from './exam/exam.module';
import { QcmModule } from './qcm/qcm.module';
import { QcmAnswerModule } from './qcm_answer/qcm_answer.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    // 1. Load ConfigModule FIRST so env variables are available globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Configure TypeORM with PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: String(configService.get('DB_PASSWORD')),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
    }),

    // 3. i18n Configuration (Single Instance)
    I18nModule.forRoot({
      fallbackLanguage: 'fr',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n/'),
        watch: true,
      },
      resolvers: [
        new HeaderResolver(['x-custom-lang']),
        AcceptLanguageResolver,
      ],
    }),

    // 4. Feature Modules
    AuthModule,
    UserModule,
    YearModule,
    SemesterModule,
    SubjectModule,
    CourseModule,
    ExamModule,
    QcmModule,
    QcmAnswerModule,
    EmailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

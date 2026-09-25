import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import {
  I18nModule,
  HeaderResolver,
  AcceptLanguageResolver,
} from 'nestjs-i18n';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CourseModule } from './course/course.module';
import { EmailModule } from './email/email.module';
import { ExamModule } from './exam/exam.module';
import { FlashcardModule } from './flash-card/flash-card.module';
import { ImageModule } from './image/image.module';
import { MedicamentModule } from './medicament/medicament.module';
import { MindmapModule } from './mindmap/mindmap.module';
import { QcmModule } from './qcm/qcm.module';
import { QcmAnswerModule } from './qcm_answer/qcm_answer.module';
import { RedeemCodeModule } from './redeem_code/redeem_code.module';
import { SemesterModule } from './semester/semester.module';
import { SessionQuestionAnswerModule } from './session-question-answer/session-question-answer.module';
import { SessionQuestionModule } from './session-question/session-question.module';
import { SessionModule } from './session/session.module';
import { SubjectModule } from './subject/subject.module';
import { SummaryModule } from './summary/summary.module';
import { TasksModule } from './tasks/tasks.module';
import { TdModule } from './td/td.module';
import { TodoModule } from './todo/todo.module';
import { TpModule } from './tp/tp.module';
import { UserModule } from './user/user.module';
import { YearModule } from './year/year.module';


// Feature Modules


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
    RedeemCodeModule,
    TdModule,
    TpModule,
    TodoModule,
    TasksModule,
    SessionModule,
    SessionQuestionModule,
    SessionQuestionAnswerModule,
    SummaryModule,
    MindmapModule,
    ImageModule,
    CloudinaryModule,
    FlashcardModule,
    MedicamentModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { Session } from './entities/session.entity';

import { SessionQuestion } from 'src/session-question/entities/session-question.entity';
import { SessionQuestionAnswer } from 'src/session-question-answer/entities/session-question-answer.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';
import { QcmAnswer } from 'src/qcm_answer/entities/qcm_answer.entity';
import { Course } from 'src/course/entities/course.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      SessionQuestion,
      SessionQuestionAnswer,
      Qcm,
      QcmAnswer,
      Course,
      Subject,
      User,
    ]),
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}

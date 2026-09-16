import { Module } from '@nestjs/common';
import { SessionQuestionAnswerService } from './session-question-answer.service';
import { SessionQuestionAnswerController } from './session-question-answer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionQuestionAnswer } from './entities/session-question-answer.entity';

@Module({
  controllers: [SessionQuestionAnswerController],
  providers: [SessionQuestionAnswerService],
  imports: [TypeOrmModule.forFeature([SessionQuestionAnswer])],
})
export class SessionQuestionAnswerModule {}

import { Module } from '@nestjs/common';
import { SessionQuestionService } from './session-question.service';
import { SessionQuestionController } from './session-question.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionQuestion } from './entities/session-question.entity';

@Module({
  controllers: [SessionQuestionController],
  providers: [SessionQuestionService],
  imports: [TypeOrmModule.forFeature([SessionQuestion])],
})
export class SessionQuestionModule {}

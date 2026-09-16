import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQcm } from './entities/examQcm.entity';
import { ExamSession } from './entities/examSession.entity';
import { ExamSessionAnswer } from './entities/examSessionAnswer';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, ExamQcm, ExamSession, ExamSessionAnswer])],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule { }

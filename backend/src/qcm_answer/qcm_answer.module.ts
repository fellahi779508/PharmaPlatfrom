import { Module } from '@nestjs/common';
import { QcmAnswerService } from './qcm_answer.service';
import { QcmAnswerController } from './qcm_answer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QcmAnswer } from './entities/qcm_answer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QcmAnswer])],
  controllers: [QcmAnswerController],
  providers: [QcmAnswerService],
})
export class QcmAnswerModule {}

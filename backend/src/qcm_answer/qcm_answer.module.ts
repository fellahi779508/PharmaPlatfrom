import { Module } from '@nestjs/common';
import { QcmAnswerService } from './qcm_answer.service';
import { QcmAnswerController } from './qcm_answer.controller';

@Module({
  controllers: [QcmAnswerController],
  providers: [QcmAnswerService],
})
export class QcmAnswerModule {}

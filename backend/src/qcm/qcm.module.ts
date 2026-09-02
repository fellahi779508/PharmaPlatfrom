import { Module } from '@nestjs/common';
import { QcmService } from './qcm.service';
import { QcmController } from './qcm.controller';

@Module({
  controllers: [QcmController],
  providers: [QcmService],
})
export class QcmModule {}

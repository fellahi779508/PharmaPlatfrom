import { Module } from '@nestjs/common';
import { QcmService } from './qcm.service';
import { QcmController } from './qcm.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Qcm } from './entities/qcm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Qcm])],
  controllers: [QcmController],
  providers: [QcmService],
})
export class QcmModule {}

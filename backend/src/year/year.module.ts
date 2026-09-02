import { Module } from '@nestjs/common';
import { YearService } from './year.service';
import { YearController } from './year.controller';

@Module({
  controllers: [YearController],
  providers: [YearService],
})
export class YearModule {}

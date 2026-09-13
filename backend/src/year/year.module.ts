import { Module } from '@nestjs/common';
import { YearService } from './year.service';
import { YearController } from './year.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Year } from './entities/year.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Year])],
  controllers: [YearController],
  providers: [YearService],
  exports: [YearService],
})
export class YearModule {}

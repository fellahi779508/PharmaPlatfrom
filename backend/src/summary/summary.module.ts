import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryController } from './summary.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Summary } from './entities/summary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Summary])],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule { }

import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryController } from './summary.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Summary } from './entities/summary.entity';
import { Image } from 'src/image/entities/image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Summary, Image])],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule { }

import { Module } from '@nestjs/common';
import { MindmapService } from './mindmap.service';
import { MindmapController } from './mindmap.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mindmap } from './entities/mindmap.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mindmap])],
  controllers: [MindmapController],
  providers: [MindmapService],
})
export class MindmapModule { }

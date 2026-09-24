import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Image } from './entities/image.entity';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { Summary } from 'src/summary/entities/summary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Image, Summary])],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule { }
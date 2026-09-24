import { Module } from '@nestjs/common';
import { MedicamentService } from './medicament.service';
import { MedicamentController } from './medicament.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medicament } from './entities/medicament.entity';
import { Image } from 'src/image/entities/image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Medicament, Image])],
  controllers: [MedicamentController],
  providers: [MedicamentService],
})
export class MedicamentModule { }

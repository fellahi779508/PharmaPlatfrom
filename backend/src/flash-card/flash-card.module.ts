import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FlashcardCron } from './flashcard.cron';
import { Qcm } from 'src/qcm/entities/qcm.entity';
import { Medicament } from 'src/medicament/entities/medicament.entity';
import { Year } from 'src/year/entities/year.entity';
import { User } from 'src/user/entities/user.entity';
import { DailyFlashcard } from './entities/flash-card.entity';
import { FlashcardController } from './flash-card.controller';
import { FlashcardService } from './flash-card.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailyFlashcard,
      Qcm,
      Medicament,
      Year,
      User,
    ]),
  ],
  controllers: [FlashcardController],
  providers: [FlashcardService, FlashcardCron],
  exports: [FlashcardService],
})
export class FlashcardModule { }
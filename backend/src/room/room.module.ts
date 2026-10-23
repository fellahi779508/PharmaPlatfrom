import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { RoomGateway } from './room.gateway';
import { Room } from './entities/room.entity';
import { RoomPlayer } from 'src/room-player/entities/room-player.entity';
import { User } from 'src/user/entities/user.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';
import { QcmAnswer } from 'src/qcm_answer/entities/qcm_answer.entity';
import { Session } from 'src/session/entities/session.entity';
import { SessionQuestion } from 'src/session-question/entities/session-question.entity';
import { Exam } from 'src/exam/entities/exam.entity';
import { ExamQcm } from 'src/exam/entities/examQcm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      RoomPlayer,
      User,
      Qcm,
      QcmAnswer,
      Session,
      SessionQuestion,
      Exam,
      ExamQcm,
    ]),
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomGateway],
  exports: [RoomService],
})
export class RoomModule {}

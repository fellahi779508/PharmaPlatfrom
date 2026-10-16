import { Module } from '@nestjs/common';
import { RoomPlayerService } from './room-player.service';
import { RoomPlayerController } from './room-player.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomPlayer } from './entities/room-player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoomPlayer])],
  controllers: [RoomPlayerController],
  providers: [RoomPlayerService],

})
export class RoomPlayerModule { }

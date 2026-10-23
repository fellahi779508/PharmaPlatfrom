import { Injectable } from '@nestjs/common';
import { CreateRoomPlayerDto } from './dto/create-room-player.dto';
import { UpdateRoomPlayerDto } from './dto/update-room-player.dto';

@Injectable()
export class RoomPlayerService {
  create(createRoomPlayerDto: CreateRoomPlayerDto) {
    return 'This action adds a new roomPlayer';
  }

  findAll() {
    return `This action returns all roomPlayer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roomPlayer`;
  }

  update(id: number, updateRoomPlayerDto: UpdateRoomPlayerDto) {
    return `This action updates a #${id} roomPlayer`;
  }

  remove(id: number) {
    return `This action removes a #${id} roomPlayer`;
  }
}

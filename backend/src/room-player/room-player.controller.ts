import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoomPlayerService } from './room-player.service';
import { CreateRoomPlayerDto } from './dto/create-room-player.dto';
import { UpdateRoomPlayerDto } from './dto/update-room-player.dto';

@Controller('room-player')
export class RoomPlayerController {
  constructor(private readonly roomPlayerService: RoomPlayerService) {}

  @Post()
  create(@Body() createRoomPlayerDto: CreateRoomPlayerDto) {
    return this.roomPlayerService.create(createRoomPlayerDto);
  }

  @Get()
  findAll() {
    return this.roomPlayerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomPlayerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomPlayerDto: UpdateRoomPlayerDto) {
    return this.roomPlayerService.update(+id, updateRoomPlayerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomPlayerService.remove(+id);
  }
}

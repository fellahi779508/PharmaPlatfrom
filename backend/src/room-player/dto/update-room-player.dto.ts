import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomPlayerDto } from './create-room-player.dto';

export class UpdateRoomPlayerDto extends PartialType(CreateRoomPlayerDto) {}

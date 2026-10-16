import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * POST /room
   * Create a new private room (host only).
   * Returns room with the join code.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRoomDto, @Req() req) {
    return this.roomService.create(dto, req.user.id);
  }

  /**
   * GET /room/code/:code
   * Look up a room by its join code (before joining via socket).
   */
  @UseGuards(JwtAuthGuard)
  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.roomService.findByCode(code);
  }

  /**
   * GET /room/:id
   * Get a room by its UUID.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.roomService.findById(id);
  }

  /**
   * GET /room/:id/leaderboard
   * Get final leaderboard (after game ends).
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.roomService.getLeaderboard(id);
  }

  /**
   * DELETE /room/:id/player
   * Self-leave a room via HTTP (alternative to socket leave_room).
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/player')
  removePlayer(@Param('id') id: string, @Req() req) {
    return this.roomService.removePlayer(id, req.user.id);
  }

  /**
   * DELETE /room/:id
   * Delete a room (host only). Cascades to session/exam.
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteRoom(@Param('id') id: string, @Req() req) {
    return this.roomService.deleteRoom(id, req.user.id);
  }
}

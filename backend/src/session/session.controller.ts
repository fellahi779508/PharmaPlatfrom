import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
// import { RolesGuard } from 'src/auth/guards/roles.guard';
// import { Roles } from 'src/auth/decorators/roles.decorator';
import { IsArray, IsInt } from 'class-validator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

class RevealDto {
  @IsArray()
  @IsInt({ each: true })
  selectedAnswerIds: number[];
}

@Controller('session')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  // POST /sessions  → create
  @Post()
  create(@Body() dto: CreateSessionDto, @Req() req) {
    return this.sessionService.create(dto, req.user.id);
  }

  // GET /sessions  → all (admin)
  @Get()
  findAll() {
    return this.sessionService.findAll();
  }

  // GET /sessions/me  → current user’s sessions
  @Get('me')
  getMySessions(@Req() req) {
    return this.sessionService.getSessionsOfStudent(req.user.id);
  }

  // GET /sessions/student/:studentId  → admin or self
  @Get('student/:studentId')
  getSessionsOfStudent(@Param('studentId') studentId: string, @Req() req) {
    // Optionally restrict: only admin or the student themselves
    // if (req.user.id !== studentId && req.user.role !== 'admin') throw new ForbiddenException();
    return this.sessionService.getSessionsOfStudent(studentId);
  }

  // GET /sessions/:id  → session meta
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.sessionService.findOne(id, req.user.id);
  }

  // GET /sessions/:id/play  → current question (resume)
  @Get(':id/play')
  getPlay(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.sessionService.getPlay(id, req.user.id);
  }

  // POST /sessions/:id/questions/:questionId/draft  → autosave selections
  @Post(':id/questions/:questionId/draft')
  saveDraft(
    @Param('id', ParseIntPipe) id: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: RevealDto,
    @Req() req,
  ) {
    return this.sessionService.saveDraft(
      id,
      questionId,
      dto.selectedAnswerIds,
      req.user.id,
    );
  }

  // POST /sessions/:id/questions/:questionId/reveal  → check answer
  @Post(':id/questions/:questionId/reveal')
  reveal(
    @Param('id', ParseIntPipe) id: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: RevealDto,
    @Req() req,
  ) {
    return this.sessionService.reveal(
      id,
      questionId,
      dto.selectedAnswerIds,
      req.user.id,
    );
  }

  // POST /sessions/:id/next  → move to next question or complete
  @Post(':id/next')
  next(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.sessionService.next(id, req.user.id);
  }

  // POST /sessions/:id/restart  → restart a session
  @Post(':id/restart')
  restart(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.sessionService.restart(id, req.user.id);
  }

  // PATCH /sessions/:id
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSessionDto,
    @Req() req,
  ) {
    return this.sessionService.update(id, dto);
  }

  // DELETE /sessions/:id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.sessionService.remove(id, req.user.id);
  }
}

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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';

class RevealDto {
  @IsArray()
  @IsInt({ each: true })
  selectedAnswerIds: number[];
}

@Controller('session')

export class SessionController {
  constructor(private readonly sessionService: SessionService) { }


  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateSessionDto, @Req() req) {
    return this.sessionService.create(dto, req.user.id);
  }

  // GET /sessions  → all (admin)
  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.sessionService.findAll();
  }

  // GET /sessions/me  → current user’s sessions

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('me')
  getMySessions(@Req() req) {
    return this.sessionService.getSessionsOfStudent(req.user.id);
  }

  // GET /sessions/student/:studentId  → admin or self

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('student/:studentId')
  getSessionsOfStudent(@Param('studentId') studentId: string, @Req() req) {
    // Optionally restrict: only admin or the student themselves
    // if (req.user.id !== studentId && req.user.role !== 'admin') throw new ForbiddenException();
    return this.sessionService.getSessionsOfStudent(studentId);
  }

  // GET /sessions/:id  → session meta
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.sessionService.findOne(id, req.user.id);
  }

  // GET /sessions/:id/play  → current question (resume)

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id/play')
  getPlay(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.sessionService.getPlay(id, req.user.id);
  }

  // POST /sessions/:id/questions/:questionId/draft  → autosave selections
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
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
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
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
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Post(':id/next')
  next(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.sessionService.next(id, req.user.id);
  }

  // POST /sessions/:id/restart  → restart a session
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Post(':id/restart')
  restart(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.sessionService.restart(id, req.user.id);
  }

  // PATCH /sessions/:id
  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSessionDto,
    @Req() req,
  ) {
    return this.sessionService.update(id, dto);
  }


  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.sessionService.remove(id, req.user.id);
  }
}
